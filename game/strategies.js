class BettingStrategy {
    constructor(config) {
        this.initialBet = config.initialBet;
        this.currentBet = this.initialBet;
        this.maxBet = config.maxBet;
        this.minBet = config.minBet;
        this.targetMultiplier = config.targetMultiplier;
        this.stopLoss = config.stopLoss;
        this.takeProfit = config.takeProfit;
        this.martingaleMultiplier = config.martingaleMultiplier || 2;
        this.consecutiveLosses = 0;
        this.consecutiveWins = 0;
    }

    calculateNextBet(lastResult = null) {
        if (!lastResult) {
            return this.initialBet; // First bet
        }

        if (lastResult.won) {
            this.consecutiveWins++;
            this.consecutiveLosses = 0;
            this.currentBet = this.initialBet; // Reset to initial bet after win
        } else {
            this.consecutiveLosses++;
            this.consecutiveWins = 0;
            // Martingale: double bet after loss, but respect maxBet
            this.currentBet = Math.min(this.currentBet * this.martingaleMultiplier, this.maxBet);
        }

        return Math.max(this.minBet, Math.min(this.currentBet, this.maxBet));
    }

    shouldStopTrading(stats) {
        return (
            stats.totalLoss <= -this.stopLoss ||
            stats.totalProfit >= this.takeProfit ||
            this.consecutiveLosses >= 5
        );
    }

    shouldBet(currentMultiplier) {
        return currentMultiplier === null || currentMultiplier === 0;
    }
}

module.exports = BettingStrategy;