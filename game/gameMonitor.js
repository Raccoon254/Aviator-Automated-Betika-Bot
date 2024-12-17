const config = require('../util/config');
const logger = require('../util/logger');
const FrameHelper = require('../util/frameHelper');
const database = require('../database/database');

class GameMonitor {
    constructor(page, config) {
        this.page = page;
        this.config = config;
        this.strategy = new BettingStrategy({
            initialBet: 1.00,
            maxBet: 100.00,
            minBet: 1.00,
            targetMultiplier: 1.50,
            stopLoss: 50.00,
            takeProfit: 100.00,
            martingaleMultiplier: 2
        });
        this.statsTracker = new StatsTracker();
        this.betManager = new BetManager(config, this.strategy, this.statsTracker);
        this.previousMultiplier = null;
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
                this.config.SELECTORS.GAME.BUBBLE_MULTIPLIER
            );

            const { bubbleValue, formattedBalance } = await this.getGameValues(frame);

            // If multiplier changed from a higher value to null/0, it means game crashed
            if (this.previousMultiplier && (!bubbleValue || bubbleValue === 0)) {
                this.betManager.handleGameCrash(this.previousMultiplier);
            }

            if (bubbleValue) {
                await this.betManager.checkCashout(frame);
            } else if (!this.betManager.isWaitingForResult && this.betManager.shouldContinueTrading()) {
                await this.betManager.placeBet(frame);
            }

            this.previousMultiplier = bubbleValue;

            // Log status
            const stats = this.statsTracker.getStats();
            logger.info(
                `Multiplier: ${bubbleValue}x | Balance: ${formattedBalance} | ` +
                `Profit: ${stats.netProfit.toFixed(2)} | ` +
                `Win Rate: ${stats.winRate.toFixed(1)}% | ` +
                `Trades: ${stats.totalTrades}`
            );

        } catch (error) {
            logger.error(`Game monitoring error: ${error.message}`);
        }
    }

    startMonitoring() {
        setInterval(() => this.monitorGame(), config.GAME.POLLING_INTERVAL);
    }
}

module.exports = GameMonitor;