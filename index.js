const puppeteer = require('puppeteer');
const mysql = require('mysql');

// const connection = mysql.createConnection({
//   host: 'localhost',
//   user: 'root',
//   password: '',
//   database: 'aviatorBot'
// });

// connection.connect((err) => {
//   if (err) {
//     console.error('Error connecting to database:', err);
//     return;
//   }

//   console.log('Connected to database!');
// });

let previousBubbleValue = null;

// const saveToDatabase = (appBubbleValue) => {
//   if (appBubbleValue !== previousBubbleValue) {
//     const query = `INSERT INTO bubble_data (value) VALUES (${appBubbleValue})`;
  
//     connection.query(query, (err, result) => {
//       if (err) {
//         console.error('Error saving data to database:', err);
//         return;
//       }
  
//       console.log('Data saved to database!');
//     });
  
//     previousBubbleValue = appBubbleValue;
//   } else {
//     console.log('Loading changes...');
//   }
// };



(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Increase the default navigation timeout
  page.setDefaultNavigationTimeout(60000); // 60 seconds

  await page.goto('https://spribe.co/welcome');

  await page.waitForSelector('.accordion-body.shadow');
  await page.click('.accordion-body.shadow');

  await page.waitForSelector('.btn.btn-primary.btn-lg.px-5.btn-demo.btn-danger');
  await page.click('.btn.btn-primary.btn-lg.px-5.btn-demo.btn-danger');

  await page.waitForSelector('.btn.btn-md.btn-primary.btn-age');
  await page.click('.btn.btn-md.btn-primary.btn-age');

  // Listen for the targetcreated event to detect when a new tab is opened
  browser.on('targetcreated', async target => {
    if (target.type() === 'page') {
      const newPage = await target.page();
      console.log('success');

      // Log the new page's URL if newPage is not null
      if (newPage) {
        await newPage.waitForNavigation();
          console.log(await newPage.url());

          //TEST MODE
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
    
    
    
            let previousAppBubbleValue = null;
            let shouldBet = false;
            
            const logLatestAppBubbleValue = async () => {
              try {
                const frame = await waitForSelectorInFrames(newPage, '.payouts-wrapper .bubble-multiplier');
            
                const appBubbleValue = await frame.evaluate(() => {
                    const bubbleMultipliers = document.querySelectorAll('.payouts-wrapper .bubble-multiplier');
                    const latestBubbleMultiplier = bubbleMultipliers[0];
                    const value = latestBubbleMultiplier ? latestBubbleMultiplier.textContent.trim() : null;
                    return value ? parseFloat(value.slice(0, -1)) : null;
                });
                  
                const myBalance = await frame.evaluate(() => {
                    const balanceElement = document.querySelector('.balance .amount');
                    const balanceText = balanceElement ? balanceElement.textContent.trim() : null;
                    return balanceText ? parseFloat(balanceText) : null;
                  });
                  
                  console.log('Latest data win :?', appBubbleValue);
                  console.log('Latest Balance is :?', myBalance);

                  //saveToDatabase(appBubbleValue);


                if (appBubbleValue < 1.50 && (previousAppBubbleValue === null || appBubbleValue !== previousAppBubbleValue)) {
                  shouldBet = true;
                } else {
                  shouldBet = false;
                }
            
                  if (shouldBet) {
                    
                  console.log('sudoMode::>>isBetting.');
            
                  const betButtonFrame = await waitForSelectorInFrames(newPage, 'div.buttons-block > button.btn.btn-success.bet.ng-star-inserted', 60000);
            
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
                  console.log('Latest > 1.50, isWaiting.');
                }
            
                previousAppBubbleValue = appBubbleValue;
            
                await newPage.mainFrame();
              } catch (error) {
                console.error('Error while trying to log latest app bubble value:', error.message);
              }
            };
            
            setInterval(logLatestAppBubbleValue, 4000);     

      } else {
        console.log('newPage is null');
      }
    }
  });

  // Close the browser after 24 hours
  setTimeout(async () => {
    await browser.close();
  }, 24 * 60 * 60 * 1000); // 24 hours in milliseconds
})();
