const mysql = require('mysql');
const config = require('../util/config');
const logger = require('../util/logger');

class Database {
    constructor() {
        this.connection = null;
        this.previousBubbleValue = null;
    }

    connect() {
        this.connection = mysql.createConnection(config.DATABASE);

        this.connection.connect((err) => {
            if (err) {
                logger.error(`Database connection error: ${err.message}`);
                return;
            }
            logger.info('Successfully connected to database');
        });
    }

    async saveBubbleValue(value) {
        if (value === this.previousBubbleValue) {
            logger.debug('No change in bubble value, skipping save');
            return;
        }

        return new Promise((resolve, reject) => {
            const query = 'INSERT INTO bubble_data (value) VALUES (?)';
            this.connection.query(query, [value], (err, result) => {
                if (err) {
                    logger.error(`Database save error: ${err.message}`);
                    reject(err);
                    return;
                }
                logger.info(`Saved bubble value: ${value}`);
                this.previousBubbleValue = value;
                resolve(result);
            });
        });
    }

    disconnect() {
        if (this.connection) {
            this.connection.end();
            logger.info('Database connection closed');
        }
    }
}

module.exports = new Database();