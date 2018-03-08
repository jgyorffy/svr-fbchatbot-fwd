'use strict';

const config = require('config');
const mongo = require('./mongoclient')({
    username: config.get('mongoDBUserName'),
    password: config.get('mongoDBPassword'),
    database: config.get('mongoDBConfigDBName')
});

const cbPromise = new Promise((resolve, reject) => {
    mongo.then((m) => {
        if (m != null) {
            const mongoose = m.getDatabase();
            models.companyAPI = require('../model/companyapi')(mongoose);
            models.chatbotBusConfig = require('../model/chatbot-bus-config')(mongoose);
            resolve(true);
        } else {
            reject(Error("No database connection"));
        }
    });
});

const models = {
    init: () => cbPromise
}

module.exports = models;