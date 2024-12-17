const puppeteer = require('puppeteer');
const config = require('./util/config');
const logger = require('./util/logger');
const GameMonitor = require('./game/gameMonitor');
const BettingStrategy = require('./game/strategies');
const database = require('./database/database');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Function to get user input
const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

async function selectStrategy() {
    console.log('\nAvailable Strategies:');
    console.log('1. Conservative (Lower risk, smaller profits)');
    console.log('2. Moderate (Balanced risk and reward)');
    console.log('3. Aggressive (Higher risk, larger potential profits)');
    console.log('4. Custom (Define your own parameters)\n');

    const choice = await askQuestion('Select strategy (1-4): ');

    switch (choice) {
        case '1':
            return config.BETTING_STRATEGIES.CONSERVATIVE;
        case '2':
            return config.BETTING_STRATEGIES.MODERATE;
        case '3':
            return config.BETTING_STRATEGIES.AGGRESSIVE;
        case '4':
            return await customStrategySetup();
        default:
            logger.warn('Invalid choice, using Moderate strategy');
            return config.BETTING_STRATEGIES.MODERATE;
    }
}

async function customStrategySetup() {
    const strategy = {
        initialBet: parseFloat(await askQuestion('Initial bet amount: ')),
        maxBet: parseFloat(await askQuestion('Maximum bet amount: ')),
        minBet: parseFloat(await askQuestion('Minimum bet amount: ')),
        targetMultiplier: parseFloat(await askQuestion('Target multiplier (e.g., 1.5): ')),
        stopLoss: parseFloat(await askQuestion('Stop loss amount: ')),
        takeProfit: parseFloat(await askQuestion('Take profit amount: ')),
        martingaleMultiplier: parseFloat(await askQuestion('Martingale multiplier (e.g., 2): '))
    };

    // Validate inputs
    if (Object.values(strategy).some(isNaN)) {
        logger.error('Invalid input detected, using Moderate strategy');
        return config.BETTING_STRATEGIES.MODERATE;
    }

    return strategy;
}

async function initializeBrowser() {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null, // Automatically adjust viewport
        args: ['--start-maximized'] // Start with maximized window
    });
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(config.NAVIGATION.TIMEOUT);
    return { browser, page };
}

async function navigateInitialPages(page) {
    await page.goto(config.NAVIGATION.BASE_URL);

    for (const [name, selector] of Object.entries(config.SELECTORS.INITIAL)) {
        try {
            await page.waitForSelector(selector, { timeout: config.NAVIGATION.TIMEOUT });
            await page.click(selector);
            logger.info(`Clicked ${name}`);
            // Add small delay between clicks
            await page.waitForTimeout(1000);
        } catch (error) {
            logger.error(`Failed to click ${name}: ${error.message}`);
            throw error;
        }
    }
}

async function handleNewTab(target, browser, strategyConfig) {
    if (target.type() === 'page') {
        const newPage = await target.page();
        if (newPage) {
            try {
                await newPage.waitForNavigation({ timeout: config.NAVIGATION.TIMEOUT });
                logger.info(`Navigated to game page: ${await newPage.url()}`);

                // Pass both page and config to GameMonitor constructor
                const gameMonitor = new GameMonitor(newPage, config);

                // If you have a strategyConfig, update the strategy
                if (strategyConfig) {
                    gameMonitor.strategy = new BettingStrategy(strategyConfig);
                }

                // Setup page error handling
                newPage.on('error', error => {
                    logger.error(`Page error: ${error.message}`);
                });

                newPage.on('pageerror', error => {
                    logger.error(`Page error: ${error.message}`);
                });

                gameMonitor.startMonitoring();

                // Log strategy info
                logger.info('Strategy Configuration:');
                logger.info(`Initial Bet: ${strategyConfig.initialBet}`);
                logger.info(`Target Multiplier: ${strategyConfig.targetMultiplier}`);
                logger.info(`Stop Loss: ${strategyConfig.stopLoss}`);
                logger.info(`Take Profit: ${strategyConfig.takeProfit}`);
            } catch (error) {
                logger.error(`Error in new tab: ${error.message}`);
                await newPage.close();
            }
        }
    }
}

async function setupGracefulShutdown(browser) {
    const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];

    signals.forEach(signal => {
        process.on(signal, async () => {
            logger.info(`Received ${signal}, shutting down gracefully...`);

            try {
                await browser.close();
                // database.disconnect();
                logger.info('Cleanup completed');
                rl.close();
                process.exit(0);
            } catch (error) {
                logger.error(`Error during shutdown: ${error.message}`);
                process.exit(1);
            }
        });
    });
}

async function main() {
    try {
        logger.info('Starting Aviator Bot...');

        // Get strategy configuration from user
        const strategyConfig = await selectStrategy();
        logger.info('Strategy selected, initializing bot...');

        // Initialize database if needed
        // database.connect();

        const { browser, page } = await initializeBrowser();
        logger.info('Browser initialized');

        // Setup graceful shutdown
        await setupGracefulShutdown(browser);

        await navigateInitialPages(page);

        // Setup new tab handling with selected strategy
        browser.on('targetcreated', (target) => handleNewTab(target, browser, strategyConfig));

        // Set up cleanup
        setTimeout(async () => {
            await browser.close();
            // database.disconnect();
            logger.info('Bot shutdown completed');
            rl.close();
            process.exit(0);
        }, config.NAVIGATION.RUN_DURATION);

    } catch (error) {
        logger.error(`Bot initialization error: ${error.message}`);
        rl.close();
        process.exit(1);
    }
}

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

main().then(() => {
    logger.info('Bot initialization completed');
}).catch(error => {
    logger.error(`Failed to start bot: ${error.message}`);
    process.exit(1);
});