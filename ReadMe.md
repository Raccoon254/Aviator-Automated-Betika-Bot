# 🎮 Aviator Betting Bot

## ⚠️ Disclaimer

Please dont message me requesting me to create a bot for free or requesting me to help you configure the bot, Im am normally bery busy and I made this opensource for you guys to help me develop it, not me to help you!!

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D%2014.0.0-brightgreen.svg)](https://nodejs.org/)
[![contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](https://github.com/yourusername/aviator-bot/issues)

An intelligent automation tool for the Aviator game, leveraging Node.js, Puppeteer, and advanced betting strategies. This bot automates the betting process while implementing smart risk management and real-time analytics.

## 📑 Table of Contents

- [Features](#-features)
- [Requirements](#-requirements)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [How It Works](#-how-it-works)
- [Architecture](#-architecture)
- [Strategies](#-strategies)
- [Contributing](#-contributing)
- [Future Enhancements](#-future-enhancements)
- [FAQ](#-faq)
- [Disclaimer](#-disclaimer)

## ✨ Features

### Core Features
- 🤖 Fully automated betting with customizable strategies
- 📊 Real-time game monitoring and analysis
- 💰 Smart bankroll management
- 📈 Comprehensive statistics tracking
- 🔄 Martingale and custom betting progressions
- ⚡ Fast and reliable browser automation
- 📝 Detailed logging and error handling

### Advanced Features
- 🎯 Multiple pre-configured betting strategies
- 🛑 Automatic stop-loss and take-profit
- 📱 Optional web interface for monitoring
- 🗄️ Database integration for bet history
- 📊 Statistical analysis tools

## 💻 Requirements

- Node.js (version >= 14.0.0)
- npm (comes with Node.js)
- MySQL (optional, for database features)
- Modern web browser
- Stable internet connection

## 🚀 Installation

1. Clone the repository:
```bash
git clone https://github.com/Raccoon254/Aviator-Automated-Betika-Bot.git aviator-bot
    cd aviator-bot
```

2. Install dependencies:
```bash
npm install
```

   ## You can test the bot on the live site
   ```bash
   npm run start
   ```
   Or
   ```bash
   node index.js
   ```
   If you wish to make modification proceed to the next step

3. Set up configuration:
```md
# Edit config.js with your preferred settings
```

## ⚙️ Configuration

### Base Configuration
```javascript
// util/config.js
module.exports = {
    NAVIGATION: {
        BASE_URL: 'https://spribe.co/welcome',
        TIMEOUT: 60000
    },
    GAME: {
        POLLING_INTERVAL: 4000,
        MULTIPLIER_THRESHOLD: 1.50
    }
};
```

### Strategy Configuration
```javascript
BETTING_STRATEGIES: {
    CONSERVATIVE: {
        initialBet: 1.00,
        maxBet: 50.00,
        minBet: 1.00,
        targetMultiplier: 1.20,
        stopLoss: 20.00,
        takeProfit: 40.00
    }
    // ... other strategies
}
```

## 🎮 How It Works

### 1. Game State Monitoring
```javascript
// game/gameMonitor.js
async monitorGame() {
    // Continuously monitor game state
    const gameState = await this.getGameState(frame);
    
    // Check for game phases
    if (this.isGameEnd(gameState.multiplier)) {
        // Handle game end
    }
    
    // Monitor for betting opportunities
    if (this.shouldPlaceBet(gameState)) {
        // Place bet
    }
}
```

### 2. Betting Logic
The bot implements a sophisticated betting system:

1. **Game Phase Detection**:
   - Monitors multiplier changes
   - Detects game start/end
   - Tracks betting opportunities

2. **Bet Placement**:
   ```javascript
   async placeBet(frame) {
       // Set bet amount
       await setBetAmount(frame);
       
       // Click bet button
       await clickBetButton(frame);
       
       // Monitor result
       await monitorBetResult(frame);
   }
   ```

3. **Cashout Management**:
   ```javascript
   async checkCashout(frame) {
       if (currentMultiplier >= targetMultiplier) {
           await executeCashout(frame);
       }
   }
   ```

### 3. Risk Management
- Implements stop-loss
- Tracks consecutive losses
- Manages bet sizing
- Monitors total exposure

## 🏗️ Architecture

```plaintext
aviator-bot/
│
├── database/               # Database integration
│   └── database.js        # MySQL connection and queries
│
├── game/                  # Core game logic
│   ├── betManager.js     # Bet execution
│   ├── gameMonitor.js    # Game state tracking
│   ├── statsTracker.js   # Statistics
│   └── strategies.js     # Betting strategies
│
├── util/                 # Utilities
│   ├── config.js        # Configuration
│   ├── frameHelper.js   # Frame navigation
│   └── logger.js        # Logging system
│
└── public/              # Web interface
    ├── index.html
    └── script.js
```

## 📊 Strategies

### 1. Conservative Strategy
- Initial bet: $1.00
- Target multiplier: 1.20x
- Stop loss: $20.00
- Best for: Steady, low-risk play

### 2. Moderate Strategy
- Initial bet: $2.00
- Target multiplier: 1.50x
- Stop loss: $50.00
- Best for: Balanced risk/reward

### 3. Aggressive Strategy
- Initial bet: $5.00
- Target multiplier: 2.00x
- Stop loss: $100.00
- Best for: High risk, high reward

### Custom Strategy Setup:
```javascript
const customStrategy = {
    initialBet: 3.00,
    maxBet: 75.00,
    targetMultiplier: 1.35,
    stopLoss: 30.00
};
```

## Deprecated Support for major betting sites like betika
- I removed configuration to test on live sites
- If you need the configuration for that you can message me, I will try to help
- I will try to add support for major betting sites in the future

- removed the database integration for now, I will try to add it in the future
- removed the web interface for now, I will try to add it in the future
- removed the statistical analysis tools and prediction for now, I will try to add it in the future

## How It Should Work Works
The bot operates in a series of steps as outlined below:

1. **Authentication**: Logs into the betting site using provided credentials.
2. **Navigation**: Once logged in, it navigates to the Aviator game page.
3. **Monitoring**: The bot continuously monitors the Aviator values displayed on the page, updating every 4 seconds.
4. **Analysis & Decision Making**: It analyzes the latest win values and decides whether to place a bet based on predefined conditions.
5. **Betting**: If the conditions are met, the bot places a bet.
6. **Loop**: The bot repeats the monitoring and betting process, providing real-time feedback and data logging.

> **Note**: The monitoring and betting process will continue indefinitely. To stop the bot, you will need to manually interrupt the script execution using `CTRL + C` in your terminal.


## 🔄 Future Enhancements

1. **Machine Learning Integration**
   - Pattern recognition
   - Predictive analytics
   - Risk assessment

2. **Enhanced UI**
   - Real-time statistics
   - Performance graphs
   - Strategy analysis

3. **Advanced Features**
   - Multiple account support
   - API integration
   - Mobile notifications

## ❓ FAQ

**Q: How do I customize betting strategies?**
A: Edit the strategy configurations in `util/config.js` or use the interactive prompt when starting the bot.

**Q: Is this bot guaranteed to make profit?**
A: No. This is a tool for automation and should be used responsibly with proper risk management.

**Q: How do I handle errors?**
A: Check the `logs/error.log` file for detailed error information. Most common issues are related to network connectivity or selector changes.

## ⚠️ Disclaimer

This bot is for educational purposes only. Gambling involves risk and you should never bet more than you can afford to lose. The developers are not responsible for any financial losses incurred through the use of this software.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

---
Made with ❤️ by [Raccoon254](https://www.kentom.co.ke/)
