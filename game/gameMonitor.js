const BettingStrategy = require("./strategies");
const StatsTracker = require("./statsTracker");
const BetManager = require("./betManager");
const FrameHelper = require("../util/frameHelper");
const logger = require("../util/logger");

class GameMonitor {
    constructor(page, config) {
        this.page = page;
        this.config = config;
        this.strategy = new BettingStrategy(config.BETTING_STRATEGIES.AGGRESSIVE);
        this.statsTracker = new StatsTracker();
        this.betManager = new BetManager(config, this.strategy, this.statsTracker);
        this.previousMultiplier = null;
        this.multiplierHistory = [];
        this.historySize = config.GAME.HISTORY_SIZE;
        this.gameState = {
            inProgress: false,
            lastCrashPoint: null,
            betPlaced: false
        };
    }

    isGameEnd(currentMultiplier) {
        if (!currentMultiplier || !this.previousMultiplier) return false;

        // If current multiplier is different from previous, game has ended
        return currentMultiplier !== this.previousMultiplier;
    }

    /**
     * Calculate the average multiplier from the last N games
     */
    calculateAverageMultiplier() {
        if (this.multiplierHistory.length === 0) return 0;
        const sum = this.multiplierHistory.reduce((acc, val) => acc + val, 0);
        return sum / this.multiplierHistory.length;
    }

    async getGameState(frame) {
        try {
            // Get multiplier value
            const bubbleValue = await frame.evaluate((selector) => {
                const bubbleMultipliers = document.querySelectorAll(selector);
                const latestBubbleMultiplier = bubbleMultipliers[0];
                if (!latestBubbleMultiplier) return null;
                const value = latestBubbleMultiplier.textContent.trim();
                return value ? parseFloat(value.slice(0, -1)) : null;
            }, this.config.SELECTORS.GAME.BUBBLE_MULTIPLIER);

            // Check for bet button
            const betButton = await frame.evaluate((selector) => {
                const button = document.querySelector(selector);
                if (!button) return { exists: false };
                const boundingBox = button.getBoundingClientRect();
                return {
                    exists: true,
                    text: button.textContent.trim().toLowerCase(),
                    disabled: button.disabled || false,
                    visible: boundingBox.width > 0 && boundingBox.height > 0
                };
            }, this.config.SELECTORS.GAME.BET_BUTTON);

            // Get balance
            const balance = await frame.evaluate((selector) => {
                const el = document.querySelector(selector);
                return el ? parseFloat(el.textContent.replace(/,/g, '')) : null;
            }, this.config.SELECTORS.GAME.BALANCE);

            return {
                multiplier: bubbleValue,
                betButton,
                balance,
                formattedBalance: balance ? balance.toFixed(2) : '0.00'
            };
        } catch (error) {
            logger.error(`Error getting game state: ${error.message}`);
            return null;
        }
    }

    async monitorGame() {
        try {
            const frame = await FrameHelper.waitForSelectorInFrames(
                this.page,
                this.config.SELECTORS.GAME.BUBBLE_MULTIPLIER
            );

            const gameState = await this.getGameState(frame);
            if (!gameState) return;

            // Detect game end based on multiplier change
            if (this.isGameEnd(gameState.multiplier)) {
                logger.info(`Game ended at ${this.previousMultiplier}x, new game starting at ${gameState.multiplier}x`);

                // Handle bet result first
                if (this.betManager.isWaitingForResult) {
                    this.betManager.handleGameCrash(this.previousMultiplier);
                }

                // Update history with the completed game
                if (this.previousMultiplier) {
                    this.multiplierHistory.unshift(this.previousMultiplier);
                    if (this.multiplierHistory.length > this.historySize) {
                        this.multiplierHistory.pop();
                    }
                    logger.info(`Updated multiplier history: [${this.multiplierHistory.join(', ')}]`);
                }

                this.gameState.inProgress = false;
                this.gameState.lastCrashPoint = this.previousMultiplier;
                this.gameState.betPlaced = false;
            }

            // Calculate average including current game's multiplier
            let currentHistory = [...this.multiplierHistory];
            if (gameState.multiplier) {
                currentHistory.unshift(gameState.multiplier);
                if (currentHistory.length > this.historySize) {
                    currentHistory.pop();
                }
            }
            const avgMultiplier = currentHistory.reduce((acc, val) => acc + val, 0) / currentHistory.length;
            const averageThreshold = this.strategy.averageMultiplierThreshold;

            logger.info(`Current game: ${gameState.multiplier}x | History: [${currentHistory.join(', ')}] | Average: ${avgMultiplier.toFixed(2)}x vs threshold: ${averageThreshold}`);

            // Check if we should place a bet based on current conditions
            if (!this.gameState.betPlaced &&
                gameState.betButton.exists &&
                gameState.betButton.visible &&
                !gameState.betButton.disabled &&
                this.multiplierHistory.length >= (this.historySize - 1) &&
                avgMultiplier <= averageThreshold) {

                logger.info(`Bet opportunity detected (Avg: ${avgMultiplier.toFixed(2)} <= ${averageThreshold})`);
                const success = await this.betManager.placeBet(this.page);
                if (success) {
                    this.gameState.betPlaced = true;
                    this.gameState.inProgress = true;
                }
            }

            // Check for cashout if we have an active bet
            if (this.betManager.isWaitingForResult && gameState.multiplier) {
                await this.betManager.checkCashout(frame);
            }

            this.previousMultiplier = gameState.multiplier;

            // Log status
            const stats = this.statsTracker.getStats();
            logger.info(
                `Multiplier: ${gameState.multiplier || 0}x | ` +
                `Balance: ${gameState.formattedBalance} | ` +
                `Profit: ${stats.netProfit.toFixed(2)} | ` +
                `Win Rate: ${stats.winRate.toFixed(1)}% | ` +
                `Trades: ${stats.totalTrades} | ` +
                `Can Bet: ${gameState.betButton.exists && !this.gameState.betPlaced}`
            );

        } catch (error) {
            logger.error(`Game monitoring error: ${error.message}`);
        }
    }

    startMonitoring() {
        logger.info('Starting game monitoring with aggressive strategy...');
        setInterval(() => this.monitorGame(), this.config.GAME.POLLING_INTERVAL);
    }
}

module.exports = GameMonitor;