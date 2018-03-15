'use strict';

module.exports.msgTypes = Object.freeze({
    FB_MSG_NEW: Symbol.for('fb_new_msg'),
    FB_MSG_REPLY_PLAIN_TXT: Symbol.for('fb_reply_plain_text'),
    FB_MSG_CONFIRM: Symbol.for('fb_msg_confirmation'),
    FB_MSG_POSTBACK: Symbol.for('fb_msg_postback'),
    FB_MSG_READ: Symbol.for('fb_msg_read'),
    FB_MSG_OPTIN: Symbol.for('fb_msg_optin'),
    FB_MSG_MEDIA: Symbol.for('fb_msg_media'),
    FB_MSG_BUTTON: Symbol.for('fb_msg_button'),
    FB_MSG_GENERIC: Symbol.for('fb_msg_generic'),
    FB_MSG_QUICK_REPLY: Symbol.for('fb_msg_quick_reply'),
    FB_MSG_ADD_PROFILE: Symbol.for('fb_msg_add_profile'),
    FB_MSG_DEL_PROFILE: Symbol.for('fb_msg_del_profile')
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
            msgType: module.exports.types.FB_NEW_MSG,
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
        chatbotAPIUUID,
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
            msgType: module.exports.types.FB_MSG_CONFIRM,
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
        chatbotAPIUUID,
        pageId,
        senderId,
        recipientId,
        timeOfMessage,
        payload) => {

        if (!(chatbotBusId && chatbotAPIUUId && pageId && senderId & recipientId)) {
            throw new Error("Empty required values passed");
        }

        return {
            msgType: module.exports.types.FB_MSG_POSTBACK,
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
        chatbotAPIUUID,
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
            msgType: module.exports.types.FB_MSG_READ,
            chatbotBusId,
            chatbotAPIUUID,
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
        chatbotAPIUUID,
        pageId,
        senderId,
        recipientId,
        timeOfEvent,
        optinRef) => {

        if (!(chatbotBusId && chatbotAPIUUId && pageId && senderId & recipientId)) {
            throw new Error("Empty required values passed");
        }

        return {
            msgType: module.exports.types.FB_MSG_OPTIN,
            chatbotBusId,
            chatbotAPIUUID,
            pageId,
            senderId,
            recipientId,
            timeOfEvent,
            optinRef
        }
    };