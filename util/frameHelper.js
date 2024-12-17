const logger = require('./logger');

class FrameHelper {
    static async waitForSelectorInFrames(page, selector, timeout = 30000) {
        const startTime = new Date().getTime();

        while (new Date().getTime() - startTime < timeout) {
            for (const frame of page.frames()) {
                try {
                    await frame.waitForSelector(selector, { timeout: 1000 });
                    logger.debug(`Found selector "${selector}" in frame`);
                    return frame;
                } catch (error) {
                    // Ignore the error and
                    continue;
                }
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        throw new Error(`Selector "${selector}" not found in any frame within ${timeout}ms`);
    }
}

module.exports = FrameHelper;