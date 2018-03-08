'use strict';

const log4js = require('log4js');
const log4js_extend = require("log4js-extend");
let configured = false;

module.exports = (fileName, logName) => {
    if (!configured) {
        log4js.configure({
            appenders: {
                console: {
                    type: 'console'
                },
                logstash: {
                    type: 'logstashTCP',
                    host: '127.0.0.1',
                    port: '5960',
                    appName: "svr-fbchatbot-fwd"
                },
                file: {
                    type: 'file',
                    filename: './logs/debug.log',
                    maxLogSize: 10485760,
                    backups: 5,
                    compress: true
                }
            },
            categories: {
                default: { appenders: ['console', 'logstash', 'file'], level: 'debug' }
            }
        });

        log4js_extend(log4js, {
            path: fileName,
            format: "at @name (@file:@line:@column)"
        });
        configured = true;
    }
    const logger = log4js.getLogger(logName);
    logger.level = 'debug';
    return logger;
}