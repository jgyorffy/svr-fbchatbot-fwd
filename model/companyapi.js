'use strict';

const mongoose = require('mongoose');
const logger = require('../utils/logger')(__dirname, "companyAPIModel");
const Schema = mongoose.Schema;

const companyAPI = new Schema({
    companyId: { type: String, required: [true, 'Company Id required'], index: true },
    chatbotAPIUUID: { type: String, required: [true, 'Chatbot API UUID required'], index: { unique: true } },
    chatbotBusId: { type: String, required: [true, 'Chatbot Bus Id required'], index: true }
}, { timestamps: { createdAt: 'created_at' }, strict: true, _id: false });

module.exports = (cnx) => {
    const CompanyAPIObj = cnx.model('CompanyAPI', companyAPI);
    return {
        updateByCompanyID: (obj) => {            
            CompanyAPIObj.findOneAndUpdate({ "companyId": obj.companyId }, obj,
                { upsert: true, 'new': true, runValidators: true, setDefaultsOnInsert: true }, (err, retObj) => {
                    if (err) {
                        logger.error("Error updating by company id", err)
                    }
                });
        },
        deleteByAPIUUId: (chatbotAPIUUID) => {
            CompanyAPIObj.remove({ chatbotAPIUUID }).exec((err, obj) => {
                if (err) {
                    logger.error("Error with deleting by API UUID", err);
                }
            });
        },
        findByCompanyId: (companyId, cb) => {
            const query = CompanyAPIObj.findOne({ companyId });
            find(query, cb, "company Id")
        },
        findByAPIUUId: (chatbotAPIUUID, cb) => {
            const query = CompanyAPIObj.findOne({ chatbotAPIUUID });
            find(query, cb, "chatbot API Id")
        },
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