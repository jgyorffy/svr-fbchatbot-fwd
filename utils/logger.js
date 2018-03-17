'use strict';

const config = require('config'),
    log4js = require('log4js'),
    log4js_extend = require("log4js-extend");
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
                    host: config.get('logstashHost'),
                    port: config.get('logstashPort'),
                    appName: "svr-fbchatbot-fwd"
                },
                file: {
                    type: 'file',
                    filename: config.get('localLogFilePath'),
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