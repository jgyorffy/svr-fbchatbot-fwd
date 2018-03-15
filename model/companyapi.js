'use strict';

const mongoose = require('mongoose');
const logger = require('../utils/logger')(__dirname, "companyAPIModel");
const Schema = mongoose.Schema;

const companyAPI = new Schema({
    companyId: { type: String, required: [true, 'Company Id required'], index: true },
    chatbotAPIUUID: { type: String, required: [true, 'Chatbot API UUID required'], index: { unique: true } },
    chatbotBusId: { type: String, required: [true, 'Chatbot Bus Id required'], index: true },
    pageAccessToken: { type: String, required: [true, 'Facebook page access code required'] },
    appSecret: { type: String, required: [true, 'Facebook App secret required'] }
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
        findByCompanyId: (companyId) => {
            const query = CompanyAPIObj.findOne({ companyId });
            return find(query, "company Id")
        },
        findByAPIUUId: (chatbotAPIUUID) => {
            const query = CompanyAPIObj.findOne({ chatbotAPIUUID });
            return find(query, "chatbot API Id")
        },
    }
    function find(query, name) {
        return new Promise((resolve, reject) => {
            query.exec((err, obj) => {
                if (err) {
                    logger.error("Error with find by " + name, err);
                    reject(Error(err));
                } else {
                    resolve(obj);
                }
            });
        });
    }
}