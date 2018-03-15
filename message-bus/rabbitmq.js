'use strict';

const appConfig = require('config');
const amqplib = require('amqplib');
const util = require('util');
const logger = require('../utils/logger')(__dirname, "rabbitmq");
const fs = require("fs");

module.exports = async (config) => {
    let channel = null;
    let clientconn = null;
    let connected = false;
    config = config || {};
    const host = config.host || '127.0.0.1';
    const port = config.port || 5672;
    const username = config.username || 'guest';
    const password = config.password || 'guest';
    const exchange = config.exchange || '';
    const type = config.mq_type || '';
    const durable = config.durable || true;
    const routingKey = config.routingKey || '';
    const queueName = config.queue || '';

    const conConfig = {
        protocol: 'amqps',
        hostname: host,
        port: port,
        username: username,
        password: password,
        locale: 'en_US',
        frameMax: 0,
        heartbeat: 0,
        vhost: '/',
        routing_key: routingKey,
        exchange: exchange,
        mq_type: type,
        durable: durable,
        key: fs.readFileSync(appConfig.get('systemSSLKey')),
        cert: fs.readFileSync(appConfig.get('systemSSLCert')),
        ca: null
    };

    /*
    setTimeout(() => {
      server.close();
      server.listen(PORT, HOST);
    }, 1000);

    */

    try {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
        clientconn = await amqplib.connect(conConfig);
        channel = await clientconn.createChannel();
        await channel.assertExchange(exchange, 'direct', { durable });

        if (queueName) {
            await channel.assertQueue(queueName, { durable });
            logger.info(`RabbitMQ listening to queue ${queueName} on port: ${port}`);
        } else {
            logger.info(`RabbitMQ sending to exchange ${exchange} with routing key: ${routingKey} on port: ${port}`);
        }
        connected = true;
    } catch (err) {
        logger.error("RabbitMQ connection failed: ", util.inspect(err));
    }

    return {
        send: (msg) => {
            if (!connected) {
                return;
            }
            try {
                channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(msg)), {
                    contentType: 'application/json',
                });
            } catch (err) {
                logger.error("RabbitMQ send failed: ", util.inspect(err));
            }
        },
        close: () => {
            if (!connected) {
                return;
            }
            channel.close();
            clientconn.close();
        },
        listen: (cb) => {
            if (!connected) {
                return;
            }
            channel.consume(queueName, (msg) => {
                if (logger.isDebugEnabled()) {
                    logger.debug("Received ", msg.content.toString());
                }
                cb(msg.content.toString());
            }, { noAck: true });
        }
    };

}