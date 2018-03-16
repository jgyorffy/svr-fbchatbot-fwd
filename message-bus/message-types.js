'use strict';

const uuidv1 = require('uuid/v1');

module.exports.msgTypes = Object.freeze({
    FB_MSG_NEW: Symbol.for('fb_msg_new'),
    FB_MSG_REPLY_PLAIN_TXT: Symbol.for('fb_msg_reply_plain_text'),
    FB_MSG_CONFIRM: Symbol.for('fb_msg_confirmation'),
    FB_MSG_POSTBACK: Symbol.for('fb_msg_postback'),
    FB_MSG_READ: Symbol.for('fb_msg_read'),
    FB_MSG_OPTIN: Symbol.for('fb_msg_optin'),
    FB_MSG_MEDIA: Symbol.for('fb_msg_media'),
    FB_MSG_BUTTON: Symbol.for('fb_msg_button'),
    FB_MSG_GENERIC: Symbol.for('fb_msg_generic'),
    FB_MSG_QUICK_REPLY: Symbol.for('fb_msg_quick_reply'),
    FB_MSG_ADD_PROFILE: Symbol.for('fb_msg_add_profile'),
    FB_MSG_DEL_PROFILE: Symbol.for('fb_msg_del_profile'),
    FB_MSG_STATUS_RSP: Symbol.for('fb_msg_status_response')
});

module.exports.status = Object.freeze({
    OK: 0,
    NOT_VALID_APIUUID: 1,   //not a valid api
    UNKNOWN_MSG_TYPE: 2,     //message type was not in the above list
    DELETE_PROFILE_FAILED: 3,
    ADDING_PROFILE_FAILED: 4,
    SEND_TO_MSGR_API_FAILED: 5
});

module.exports.fbNewMsg =
    (chatbotBusId,
        chatbotAPIUUId,
        pageId,
        senderId,
        recipientId,
        timeOfMessage,
        messageId,
        appId,
        chatSessionData,
        messageText,
        choiceOptions,
        firstName,
        lastName,
        gender) => {

        if (!(chatbotBusId && chatbotAPIUUId && pageId && senderId & recipientId)) {
            throw new Error("Empty required values passed");
        }
        if (!(messageText || choiceOptions)) {
            throw new Error("Empty message values passed");
        }

        return {
            msgId: uuidv1(),
            msgType: Symbol.keyFor(module.exports.msgTypes.FB_MSG_NEW),
            chatbotBusId,
            chatbotAPIUUId,
            pageId,
            senderId,
            recipientId,
            timeOfMessage,
            messageId,
            appId,
            chatSessionData,
            messageText,
            choiceOptions,
            firstName,
            lastName,
            gender
        }
    };

module.exports.fbDelConfirmation =
    (chatbotBusId,
        chatbotAPIUUId,
        pageId,
        senderId,
        recipientId,
        timeOfMessage,
        messageId,
        watermark,
        sequenceNumber) => {

        if (!(chatbotBusId && chatbotAPIUUId && pageId && senderId & recipientId)) {
            throw new Error("Empty required values passed");
        }

        return {
            msgId: uuidv1(),
            msgType: Symbol.keyFor(module.exports.msgTypes.FB_MSG_CONFIRM),
            chatbotBusId,
            chatbotAPIUUId,
            pageId,
            senderId,
            recipientId,
            timeOfMessage,
            messageId,
            watermark,
            sequenceNumber
        }
    };

module.exports.fbPostback =
    (chatbotBusId,
        chatbotAPIUUId,
        pageId,
        senderId,
        recipientId,
        timeOfMessage,
        payload) => {

        if (!(chatbotBusId && chatbotAPIUUId && pageId && senderId & recipientId)) {
            throw new Error("Empty required values passed");
        }

        return {
            msgId: uuidv1(),
            msgType: Symbol.keyFor(module.exports.msgTypes.FB_MSG_POSTBACK),
            chatbotBusId,
            chatbotAPIUUId,
            pageId,
            senderId,
            recipientId,
            timeOfMessage,
            payload
        }
    };


module.exports.fbMessageRead =
    (chatbotBusId,
        chatbotAPIUUId,
        pageId,
        senderId,
        recipientId,
        timeOfEvent,
        watermark,
        sequenceNumber) => {

        if (!(chatbotBusId && chatbotAPIUUId && pageId && senderId & recipientId)) {
            throw new Error("Empty required values passed");
        }

        return {
            msgId: uuidv1(),
            msgType: Symbol.keyFor(module.exports.msgTypes.FB_MSG_READ),
            chatbotBusId,
            chatbotAPIUUId,
            pageId,
            senderId,
            recipientId,
            timeOfEvent,
            watermark,
            sequenceNumber
        }
    };

module.exports.fbMessageOptIn =
    (chatbotBusId,
        chatbotAPIUUId,
        pageId,
        senderId,
        recipientId,
        timeOfEvent,
        optinRef) => {

        if (!(chatbotBusId && chatbotAPIUUId && pageId && senderId & recipientId)) {
            throw new Error("Empty required values passed");
        }

        return {
            msgId: uuidv1(),
            msgType: Symbol.keyFor(module.exports.msgTypes.FB_MSG_OPTIN),
            chatbotBusId,
            chatbotAPIUUId,
            pageId,
            senderId,
            recipientId,
            timeOfEvent,
            optinRef
        }
    };

module.exports.fbMessageStatusReport = (msgId, chatbotBusId, description="OK", status = module.exports.status.OK) => {

    if (!(msgId && chatbotBusId)) {
        throw new Error("Empty required values passed");
    }

    return {
        msgId,
        chatbotBusId,
        status,
        description,
        msgType: Symbol.keyFor(module.exports.msgTypes.FB_MSG_STATUS_RSP),
        timeOfEvent: new Date().getTime()
    }
};