'use strict';

const config = require('config');
const mongo = require('./mongoclient')({
    username: config.get('mongoDBUserName'),
    password: config.get('mongoDBPassword'),
    database: config.get('mongoDBConfigDBName')
});

module.exports = new Promise((resolve, reject) => {
    mongo.then((m) => {
        if (m != null) {
            const models = {};
            const mongoose = m.getDatabase();
            models.companyAPI = require('../model/companyapi')(mongoose);
            models.chatbotBusConfig = require('../model/chatbot-bus-config')(mongoose);
            resolve(models);
        } else {
            reject(Error("No database connection"));
        }
    });
});