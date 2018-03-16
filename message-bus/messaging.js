'use strict';

const config = require('config');
const logger = require('../utils/logger')(__dirname, "messaging");
const rabbitmqConfig = require('./rabbitmq')({
    host: config.get('rabbitMQHost'),
    port: config.get('rabbitMQPort'),
    username: config.get('rabbitMQUserName'),
    password: config.get('rabbitMQPassword'),
    queue: config.get('rabbitMQConfigQueueName'),
    exchange: config.get('rabbitMQChatbotExchange')
});
const database = require('../model/database');
const busIdToConnectedBusMap = {};

module.exports = async (fbSvrOnMessage) => {
    await database.init();

    const configQueue = await rabbitmqConfig;

    await loadQueue();

    configQueue.listen((msg) => {
        loadQueue();
        logger.info("Config queue notified to load new queues");
    });

    async function load(configItem) {
        if (configItem && configItem.chatbotBusId) {
            if (!busIdToConnectedBusMap[configItem.chatbotBusId]) {
                const rabbitmqSvr = require('./rabbitmq')({
                    host: config.get('rabbitMQHost'),
                    port: config.get('rabbitMQPort'),
                    username: config.get('rabbitMQUserName'),
                    password: config.get('rabbitMQPassword'),
                    queue: configItem.queueName,
                    exchange: configItem.exchange,
                    routingKey: configItem.routingKey
                });
                const bus = await rabbitmqSvr;
                busIdToConnectedBusMap[configItem.chatbotBusId] = bus;
                if (configItem.queueName) {
                    bus.listen((msg) => {
                        fbSvrOnMessage(JSON.parse(msg));
                    });
                }
            }
        }
    }

    async function loadQueue() {
        const list = await database.chatbotBusConfig.findAll();
        for (let configItem of list) {
            await load(configItem);
        }
    }

    return (message) => {
        if (busIdToConnectedBusMap[message.chatbotBusId]) {
            busIdToConnectedBusMap[message.chatbotBusId].send(message);
            if (logger.isDebugEnabled()) {
                logger.debug(`Sent fb msg to queue:\n ${JSON.stringify(message)}`);
            }
        }
    }
};