class StatsTracker {
    constructor() {
        this.reset();
    }

    reset() {
        this.trades = [];
        this.totalTrades = 0;
        this.winningTrades = 0;
        this.losingTrades = 0;
        this.totalProfit = 0;
        this.totalLoss = 0;
        this.largestWin = 0;
        this.largestLoss = 0;
        this.currentStreak = 0;
        this.longestWinStreak = 0;
        this.longestLossStreak = 0;
    }

    addTrade(trade) {
        this.trades.push(trade);
        this.totalTrades++;

        if (trade.profit > 0) {
            this.winningTrades++;
            this.totalProfit += trade.profit;
            this.largestWin = Math.max(this.largestWin, trade.profit);
            this.currentStreak = this.currentStreak > 0 ? this.currentStreak + 1 : 1;
            this.longestWinStreak = Math.max(this.longestWinStreak, this.currentStreak);
        } else {
            this.losingTrades++;
            this.totalLoss += trade.loss;
            this.largestLoss = Math.min(this.largestLoss, trade.loss);
            this.currentStreak = this.currentStreak < 0 ? this.currentStreak - 1 : -1;
            this.longestLossStreak = Math.min(this.longestLossStreak, this.currentStreak);
        }
    }

    getStats() {
        return {
            totalTrades: this.totalTrades,
            winRate: (this.winningTrades / this.totalTrades) * 100 || 0,
            totalProfit: this.totalProfit,
            totalLoss: this.totalLoss,
            netProfit: this.totalProfit + this.totalLoss,
            largestWin: this.largestWin,
            largestLoss: this.largestLoss,
            averageWin: this.totalProfit / this.winningTrades || 0,
            averageLoss: this.totalLoss / this.losingTrades || 0,
            longestWinStreak: this.longestWinStreak,
            longestLossStreak: Math.abs(this.longestLossStreak)
        };
    }
}

module.exports = StatsTracker;