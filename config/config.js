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
            BET_BUTTON: 'div.buttons-block > button.btn.btn-success.bet.ng-star-inserted'
        }
    },
    DATABASE: {
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'aviatorBot'
    }
};