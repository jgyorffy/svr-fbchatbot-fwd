'use strict';

const log4js = require('log4js');
const log4js_extend = require("log4js-extend");

module.exports = (fileName, logName) => {
    log4js.configure({
        appenders: {
            logstash: {
                type: 'logstashTCP',
                host: '127.0.0.1',
                port: '5960'
            },
            file: {
                type: 'file',
                filename: './logs/debug.log',
                maxLogSize: 10000,
                compress: true
            }
        },
        categories: {
            default: { appenders: ['logstash', 'file'], level: 'debug' }
        }
    });

    log4js_extend(log4js, {
        path: fileName,
        format: "at @name (@file:@line:@column)"
    });
    const logger = log4js.getLogger(logName);
    logger.level = 'debug';
    return logger;
}