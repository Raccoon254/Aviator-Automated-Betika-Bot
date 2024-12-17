const puppeteer = require('puppeteer');
const config = require('util/config');
const logger = require('util/logger');
const GameMonitor = require('util/gameMonitor');
const database = require('database/database');

async function initializeBrowser() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(config.NAVIGATION.TIMEOUT);
    return { browser, page };
}

async function navigateInitialPages(page) {
    await page.goto(config.NAVIGATION.BASE_URL);

    for (const [name, selector] of Object.entries(config.SELECTORS.INITIAL)) {
        await page.waitForSelector(selector);
        await page.click(selector);
        logger.info(`Clicked ${name}`);
    }
}

async function handleNewTab(target, browser) {
    if (target.type() === 'page') {
        const newPage = await target.page();
        if (newPage) {
            await newPage.waitForNavigation();
            logger.info(`Navigated to game page: ${await newPage.url()}`);

            const gameMonitor = new GameMonitor(newPage);
            gameMonitor.startMonitoring();
        }
    }
}

async function main() {
    try {
        // Initialize database if needed
        // database.connect();

        const { browser, page } = await initializeBrowser();
        logger.info('Browser initialized');

        await navigateInitialPages(page);

        browser.on('targetcreated', (target) => handleNewTab(target, browser));

        // Set up cleanup
        setTimeout(async () => {
            await browser.close();
            // database.disconnect();
            logger.info('Bot shutdown completed');
            process.exit(0);
        }, config.NAVIGATION.RUN_DURATION);

    } catch (error) {
        logger.error(`Bot initialization error: ${error.message}`);
        process.exit(1);
    }
}

main().then(r => {
    console.log('Bot started');
});