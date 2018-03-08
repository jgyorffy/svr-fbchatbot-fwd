'use strict';

const mongoose = require('mongoose');
const util = require('util');
const logger = require('../utils/logger')(__dirname, "mongo");
const fs = require("fs");

module.exports = async (config) => {
    let database = null;
    config = config || {};
    const host = config.host || 'localhost';
    const port = config.port || 27017;
    const username = config.username || 'guest';
    const password = config.password || 'guest';
    const dbName = config.database || '';

    const conConfig = {
        autoIndex: true,
        sslValidate: false,
        checkServerIdentity: false,
        ssl: true,
        sslKey: fs.readFileSync("keys/datapark_ddns_net.key.pem"),
        sslCert: fs.readFileSync("keys/datapark_ddns_net.pem")
    };

    try {
        database = await mongoose.connect(`mongodb://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}/${dbName}`, conConfig);
        logger.info("mongo listening on port: ", port);
    } catch (err) {
        logger.error("mongo connection failed: ", util.inspect(err));
        console.error(util.inspect(err));
    }

    return {
        getDatabase: () => {
            return database;
        }
    };

}