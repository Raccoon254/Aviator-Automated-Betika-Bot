const puppeteer = require('puppeteer');

const url = 'https://www.mozzartbet.co.ke/en#/';
const username = process.env.MOZZARTUSERNAME;
const password = process.env.MOZZARTPASSWORD;

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Increase the navigation timeout to 60 seconds (60000 ms)
    page.setDefaultNavigationTimeout(60000000);

    await page.goto(url);

// Navigate to the site
// ...

// Helper function to wait for a specified duration
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Click the Aviator game link before login
await page.waitForSelector('p.offer-link.dark.mozzart_ke a.aviator');
await page.click('p.offer-link.dark.mozzart_ke a.aviator');
console.log('Clicked Aviator game link before login.');


// Wait for the username and password fields to appear
await page.waitForSelector('input[type="text"][placeholder="Mobile number"]');
await page.waitForSelector('input[type="password"][placeholder="Password"]');

// Type username and password
await page.type('input[type="text"][placeholder="Mobile number"]', username);
await page.type('input[type="password"][placeholder="Password"]', password);

// Click the submit button and log in
await Promise.all([
    page.click('button.login-button'),
  page.waitForNavigation({ waitUntil: 'networkidle0' }),
    
  page.click('p.offer-link.dark.mozzart_ke a.aviator'),

]);
console.log('Submitted mobile number and password.');

// Wait for 5 seconds
await sleep(5000);

// Click the Aviator game link again after 5 seconds
await page.waitForSelector('p.offer-link.dark.mozzart_ke a.aviator');
await page.click('p.offer-link.dark.mozzart_ke a.aviator');
console.log('Clicked Aviator game link after 5-second delay.');



    async function waitForSelectorInFrames(page, selector, timeout = 30000) {
        const startTime = new Date().getTime();
        let currentFrame = null;
        let frameFound = false;

        while (new Date().getTime() - startTime < timeout) {
            for (const frame of page.frames()) {
                try {
                    await frame.waitForSelector(selector, { timeout: 1000 });
                    currentFrame = frame;
                    frameFound = true;
                    break;
                } catch (error) {
                    // Ignore the error and continue searching
                }
            }

            if (frameFound) break;

            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        if (!frameFound) {
            throw new Error(`Selector "${selector}" not found in any frame.`);
        }

        return currentFrame;
    }


    /*
      try {
          const betButtonFrame = await waitForSelectorInFrames(page, 'div.buttons-block > button.btn.btn-success.bet.ng-star-inserted', 60000);
      
          await betButtonFrame.evaluate(() => {
            const betButton = document.querySelector('div.buttons-block > button.btn.btn-success.bet.ng-star-inserted');
            if (betButton) {
              betButton.click();
            }
          });
      
          console.log('Clicked the bet button.');
        } catch (error) {
          console.error('Error while trying to click the bet button:', error.message);
        }
  */


        let previousAppBubbleValue = null;
        let shouldBet = false;
        
        const logLatestAppBubbleValue = async () => {
          try {
            const frame = await waitForSelectorInFrames(page, '.payouts-wrapper .bubble-multiplier');
        
            const appBubbleValue = await frame.evaluate(() => {
              const bubbleMultipliers = document.querySelectorAll('.payouts-wrapper .bubble-multiplier');
              const latestBubbleMultiplier = bubbleMultipliers[0];
              const value = latestBubbleMultiplier ? latestBubbleMultiplier.textContent.trim() : null;
              return value ? parseFloat(value.slice(0, -1)) : null;
            });
        
            console.log('Latest data win :?', appBubbleValue);
        
            if (appBubbleValue < 1.22 && (previousAppBubbleValue === null || appBubbleValue !== previousAppBubbleValue)) {
              shouldBet = true;
            } else {
              shouldBet = false;
            }
        
              if (shouldBet) {
                
              console.log('sudoMode::>>isBetting.');
        
              const betButtonFrame = await waitForSelectorInFrames(page, 'div.buttons-block > button.btn.btn-success.bet.ng-star-inserted', 60000);
        
              await betButtonFrame.evaluate(() => {
                const betButton = document.querySelector('div.buttons-block > button.btn.btn-success.bet.ng-star-inserted');
                if (betButton) {
                  const buttonText = betButton.textContent.trim().toLowerCase();
                  console.log('Button text:', buttonText);
        
                  if (buttonText !== 'cancel') {
                    betButton.click();
                    console.log('isBetting > Clicked !');
                  } else {
                    console.log('Bet In');
                  }
                }
              });
            } else {
              console.log('Latest > 1.23, isWaiting.');
            }
        
            previousAppBubbleValue = appBubbleValue;
        
            await page.mainFrame();
          } catch (error) {
            console.error('Error while trying to log latest app bubble value:', error.message);
          }
        };
        
        setInterval(logLatestAppBubbleValue, 4000);     





    // Wait for 24 hours (86400000 ms)
    await new Promise((resolve) => setTimeout(resolve, 86400000));

    // Add a termination notification
    console.log('Process terminated successfully after 24 minutes.');

    // Close the browser
    await browser.close();
})();
