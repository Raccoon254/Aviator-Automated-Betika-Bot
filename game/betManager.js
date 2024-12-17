const {debug, info, error} = require("../util/logger");

class BetManager {
    constructor(config, strategy, statsTracker) {
        this.config = config;
        this.strategy = strategy;
        this.statsTracker = statsTracker;
        this.currentBet = null;
        this.isWaitingForResult = false;
    }

    async placeBet(frame) {
        if (this.isWaitingForResult) {
            debug('Already waiting for result, skipping bet');
            return false;
        }

        const betAmount = this.strategy.calculateNextBet();
        info(`Attempting to place bet of ${betAmount}`);

        try {
            // Set bet amount
            const inputResult = await frame.evaluate((amount, selector) => {
                const input = document.querySelector(selector);
                if (input) {
                    input.value = amount.toString();
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    return true;
                }
                return false;
            }, betAmount, this.config.SELECTORS.GAME.BET_INPUT);

            if (!inputResult) {
                error('Could not set bet amount');
                return false;
            }

            // Small delay to ensure input is registered
            await frame.waitForTimeout(100);

            // Click the bet button
            const betPlaced = await frame.evaluate((selector) => {
                const button = document.querySelector(selector);
                if (button && !button.disabled &&
                    button.textContent.toLowerCase().includes('bet')) {
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
                info(`Bet placed: ${betAmount}`);
            } else {
                error('Could not click bet button');
            }

            return betPlaced;
        } catch (error) {
            error(`Error placing bet: ${error.message}`);
            return false;
        }
    }

    async checkCashout(frame) {
        if (!this.isWaitingForResult) return;

        const cashoutInfo = await frame.evaluate((selector) => {
            const button = document.querySelector(selector);
            if (button && button.textContent.toLowerCase().includes('cash out')) {
                const amountElement = button.querySelector('.amount span');
                if (amountElement) {
                    return {
                        multiplier: parseFloat(amountElement.textContent),
                        available: true
                    };
                }
            }
            return { available: false };
        }, this.config.SELECTORS.GAME.CASHOUT_BUTTON);

        if (cashoutInfo.available && cashoutInfo.multiplier >= this.strategy.targetMultiplier) {
            await this.cashout(frame);
        }
    }

    async cashout(frame) {
        const result = await frame.evaluate((selector) => {
            const button = document.querySelector(selector);
            if (button && button.textContent.toLowerCase().includes('cash out')) {
                button.click();
                return true;
            }
            return false;
        }, this.config.SELECTORS.GAME.CASHOUT_BUTTON);

        if (result) {
            const profit = this.currentBet.amount * (this.strategy.targetMultiplier - 1);
            this.statsTracker.addTrade({
                betAmount: this.currentBet.amount,
                multiplier: this.strategy.targetMultiplier,
                profit: profit,
                loss: 0,
                timestamp: Date.now()
            });
            this.isWaitingForResult = false;
        }
    }

    handleGameCrash(multiplier) {
        if (this.isWaitingForResult && this.currentBet) {
            this.statsTracker.addTrade({
                betAmount: this.currentBet.amount,
                multiplier: multiplier,
                profit: 0,
                loss: -this.currentBet.amount,
                timestamp: Date.now()
            });
            this.isWaitingForResult = false;
        }
    }

    shouldContinueTrading() {
        const stats = this.statsTracker.getStats();
        return !this.strategy.shouldStopTrading(stats);
    }
}

module.exports = BetManager;