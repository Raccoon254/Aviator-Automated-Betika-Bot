const config = require('../util/config');
const logger = require('../util/logger');
const FrameHelper = require('../util/frameHelper');
const database = require('../database/database');

class GameMonitor {
    constructor(page) {
        this.page = page;
        this.previousAppBubbleValue = null;
        this.shouldBet = false;
    }

    async getGameValues(frame) {
        const bubbleValue = await frame.evaluate((selector) => {
            const bubbleMultipliers = document.querySelectorAll(selector);
            const latestBubbleMultiplier = bubbleMultipliers[0];
            const value = latestBubbleMultiplier ? latestBubbleMultiplier.textContent.trim() : null;
            return value ? parseFloat(value.slice(0, -1)) : null;
        }, config.SELECTORS.GAME.BUBBLE_MULTIPLIER);

        const balance = await frame.evaluate((selector) => {
            const balanceElement = document.querySelector(selector);
            if (!balanceElement) return null;

            // Get the text content and clean it up
            const balanceText = balanceElement.textContent.trim();
            if (!balanceText) return null;

            // Remove all commas and convert to float
            const cleanBalance = balanceText.replace(/,/g, '');
            return parseFloat(cleanBalance);
        }, config.SELECTORS.GAME.BALANCE);

        // Format balance to 2 decimal places for logging
        const formattedBalance = balance ? balance.toFixed(2) : '0.00';
        return {
            bubbleValue,
            balance,
            formattedBalance
        };
    }

    async placeBet(frame) {
        const betPlaced = await frame.evaluate((selector) => {
            const betButton = document.querySelector(selector);
            if (betButton) {
                const buttonText = betButton.textContent.trim().toLowerCase();
                if (buttonText !== 'cancel') {
                    betButton.click();
                    return true;
                }
            }
            return false;
        }, config.SELECTORS.GAME.BET_BUTTON);

        return betPlaced;
    }

    async monitorGame() {
        try {
            const frame = await FrameHelper.waitForSelectorInFrames(
                this.page,
                config.SELECTORS.GAME.BUBBLE_MULTIPLIER
            );

            const { bubbleValue, formattedBalance } = await this.getGameValues(frame);

            logger.info(`Current multiplier: ${bubbleValue}x | Balance: ${formattedBalance}`);

            this.shouldBet = bubbleValue < config.GAME.MULTIPLIER_THRESHOLD &&
                bubbleValue !== this.previousAppBubbleValue;

            if (this.shouldBet) {
                logger.info('Betting condition met - attempting to place bet');
                const betPlaced = await this.placeBet(frame);
                if (betPlaced) {
                    logger.info('Bet successfully placed');
                }
            } else {
                logger.debug('Waiting for favorable conditions');
            }

            // Save to database if enabled
            // await database.saveBubbleValue(bubbleValue);

            this.previousAppBubbleValue = bubbleValue;

        } catch (error) {
            logger.error(`Game monitoring error: ${error.message}`);
        }
    }

    startMonitoring() {
        setInterval(() => this.monitorGame(), config.GAME.POLLING_INTERVAL);
    }
}

module.exports = GameMonitor;