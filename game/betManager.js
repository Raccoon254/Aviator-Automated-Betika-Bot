const logger = require('../util/logger');
const FrameHelper = require('../util/frameHelper');

class BetManager {
    constructor(config, strategy, statsTracker) {
        this.config = config;
        this.strategy = strategy;
        this.statsTracker = statsTracker;
        this.currentBet = null;
        this.isWaitingForResult = false;
    }

    async placeBet(page) {
        if (this.isWaitingForResult) {
            logger.debug('Already waiting for result, skipping bet');
            return false;
        }

        try {
            const frame = await FrameHelper.waitForSelectorInFrames(
                page,
                this.config.SELECTORS.GAME.BET_BUTTON
            );

            // Calculate bet amount
            const betAmount = this.strategy.calculateNextBet();
            logger.info(`Attempting to place bet of ${betAmount}`);

            // Set bet amount
            await frame.evaluate(async (amount, selector) => {
                const input = document.querySelector(selector);
                if (!input) return false;

                // Clear the input
                input.value = '';
                await new Promise(r => setTimeout(r, 100));

                // Set new value
                input.value = amount.toString();
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
            }, betAmount, this.config.SELECTORS.GAME.BET_INPUT);

            // Wait for input to register
            await page.waitForTimeout(200);

            // Click bet button
            const betPlaced = await frame.evaluate((selector) => {
                const button = document.querySelector(selector);
                if (button && !button.disabled && button.textContent.toLowerCase().includes('bet')) {
                    button.click();
                    return true;
                }
                return false;
            }, this.config.SELECTORS.GAME.BET_BUTTON);

            if (betPlaced) {
                this.currentBet = {
                    amount: betAmount,
                    timestamp: Date.now(),
                    targetMultiplier: this.strategy.targetMultiplier
                };
                this.isWaitingForResult = true;
                logger.info(`Successfully placed bet of ${betAmount}`);
            }

            return betPlaced;
        } catch (error) {
            logger.error(`Error placing bet: ${error.message}`);
            return false;
        }
    }

    async checkCashout(frame) {
        if (!this.isWaitingForResult) return;

        try {
            const multiplier = await frame.evaluate((selector) => {
                const element = document.querySelector(selector);
                return element ? parseFloat(element.textContent) : null;
            }, this.config.SELECTORS.GAME.CASHOUT_MULTIPLIER);

            if (multiplier && multiplier >= this.strategy.targetMultiplier) {
                logger.info(`Target multiplier reached: ${multiplier}x >= ${this.strategy.targetMultiplier}x`);
                await this.executeCashout(frame);
            }
        } catch (error) {
            logger.debug(`Cashout check: ${error.message}`);
        }
    }

    async executeCashout(frame) {
        try {
            const result = await frame.evaluate((selector) => {
                const button = document.querySelector(selector);
                if (button) {
                    button.click();
                    return true;
                }
                return false;
            }, this.config.SELECTORS.GAME.CASHOUT_BUTTON);

            if (result) {
                const profit = this.currentBet.amount * (this.strategy.targetMultiplier - 1);
                logger.info(`Cashout successful! Profit: ${profit.toFixed(2)}`);

                this.statsTracker.addTrade({
                    betAmount: this.currentBet.amount,
                    multiplier: this.strategy.targetMultiplier,
                    profit: profit,
                    loss: 0,
                    timestamp: Date.now(),
                    won: true
                });
                this.isWaitingForResult = false;
                this.currentBet = null;
            }
        } catch (error) {
            logger.error(`Error executing cashout: ${error.message}`);
        }
    }

    handleGameCrash(multiplier) {
        if (this.isWaitingForResult && this.currentBet) {
            logger.info(`Game crashed at ${multiplier}x - Lost bet of ${this.currentBet.amount}`);

            this.statsTracker.addTrade({
                betAmount: this.currentBet.amount,
                multiplier: multiplier,
                profit: 0,
                loss: -this.currentBet.amount,
                timestamp: Date.now(),
                won: false
            });

            this.isWaitingForResult = false;
            this.currentBet = null;
        }
    }
}

module.exports = BetManager;