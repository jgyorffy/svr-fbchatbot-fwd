'use strict';

const mongoose = require('mongoose');
const logger = require('../utils/logger')(__dirname, "Chatbot Bus Config");
const Schema = mongoose.Schema;

const chatbotBusConfig = new Schema({
    chatbotBusId: { type: String, required: [true, 'A chatbot bus Id is required'], index: { unique: true } },
    exchange: { type: String,  required: [true, 'A chatbot exchange is required'] },
    queueName: { type: String },
    routingKey: { type: String }
}, { timestamps: { createdAt: 'created_at' }, strict: true, _id: false });

module.exports = (cnx) => {
    const ChatbotBusConfig = cnx.model('ChatbotBusConfig', chatbotBusConfig);
    return {
        updateByChatbotBusId: (obj) => {
            ChatbotBusConfig.findOneAndUpdate({ "chatbotBusId": obj.chatbotBusId }, obj,
                { upsert: true, 'new': true, runValidators: true, setDefaultsOnInsert: true }, (err, retObj) => {
                    if (err) {
                        logger.error("Error updating by chatbotBusId", err)
                    }
                });
        },
        deleteByChatbotBusId: (chatbotBusId) => {
            ChatbotBusConfig.remove({ chatbotBusId }).exec((err, obj) => {
                if (err) {
                    logger.error("Error with deleting by chatbotBusId", err);
                }
            });
        },
        findByChatbotBusId: (chatbotBusId, cb) => {
            const query = ChatbotBusConfig.findOne({ chatbotBusId });
            find(query, cb, "chatbotBusId")
        },
        findAll: (cb) => {
            ChatbotBusConfig.find({}, (err, groups) => {
                if (err) {
                    logger.error("Error with find all", err);
                    cb(null);
                } else {
                    cb(groups);
                }
            });
        }
    }
    function find(query, cb, name) {
        query.exec((err, obj) => {
            if (err) {
                logger.error("Error with find by " + name, err);
                cb(null);
            } else {
                cb(obj);
            }
        });
    }
}