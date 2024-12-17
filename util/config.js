const config = {
    NAVIGATION: {
        BASE_URL: 'https://spribe.co/welcome',
        TIMEOUT: 60000,
        RUN_DURATION: 24 * 60 * 60 * 1000 // 24 hours
    },
    GAME: {
        POLLING_INTERVAL: 4000,
        MULTIPLIER_THRESHOLD: 1.50
    },
    SELECTORS: {
        INITIAL: {
            ACCORDION: '.accordion-body.shadow',
            DEMO_BUTTON: '.btn.btn-primary.btn-lg.px-5.btn-demo.btn-danger',
            AGE_BUTTON: '.btn.btn-md.btn-primary.btn-age'
        },
        GAME: {
            BUBBLE_MULTIPLIER: '.payouts-wrapper .bubble-multiplier',
            BALANCE: '.balance .amount',
            BET_BUTTON: 'div.buttons-block > button.btn.btn-success.bet.ng-star-inserted',
            CASHOUT_BUTTON: 'button.cashout.ng-star-inserted',
            BET_INPUT: 'input[inputmode="decimal"]',
            CASHOUT_MULTIPLIER: '.amount span:first-child'
        }
    },
    DATABASE: {
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'aviatorBot'
    },
    BETTING_STRATEGIES: {
        CONSERVATIVE: {
            initialBet: 1.00,
            maxBet: 50.00,
            minBet: 1.00,
            targetMultiplier: 1.20,
            stopLoss: 20.00,
            takeProfit: 40.00,
            martingaleMultiplier: 1.5
        },
        MODERATE: {
            initialBet: 2.00,
            maxBet: 100.00,
            minBet: 1.00,
            targetMultiplier: 1.50,
            stopLoss: 50.00,
            takeProfit: 100.00,
            martingaleMultiplier: 2
        },
        AGGRESSIVE: {
            initialBet: 5.00,
            maxBet: 200.00,
            minBet: 1.00,
            targetMultiplier: 2.00,
            stopLoss: 100.00,
            takeProfit: 300.00,
            martingaleMultiplier: 2.5
        }
    }
};

module.exports = config;