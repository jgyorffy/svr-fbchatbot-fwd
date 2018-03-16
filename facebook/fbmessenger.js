'use strict';

let onMessageFnc = null;

const
    bodyParser = require('body-parser'),
    logger = require('../utils/logger')(__dirname, "FB msg handler"),
    config = require('config'),
    crypto = require('crypto'),
    express = require('express'),
    https = require('https'),
    request = require('request'),
    fs = require("fs"),
    messagebus = require('../message-bus/messaging')((msg) => {
        onMessageFnc(msg);
    }),
    database = require('../model/database'),
    MSG_TYPES = require('../message-bus/message-types').msgTypes,
    fbNewMsg = require('../message-bus/message-types').fbNewMsg,
    fbDelConfirmation = require('../message-bus/message-types').fbDelConfirmation,
    fbPostback = require('../message-bus/message-types').fbPostback,
    fbMessageRead = require('../message-bus/message-types').fbMessageRead,
    fbMessageOptIn = require('../message-bus/message-types').fbMessageOptIn,
    fbMessageStatusReport = require('../message-bus/message-types').fbMessageStatusReport,
    STATUS = require('../message-bus/message-types').status;

const SERVER_URL = config.get('serverURL');
const FACEBOOK_STD_MSG_API_URL = config.get('facebookStdMessageAPIURL');
const FACEBOOK_PERSON_INFO_API_URL = config.get('facebookPersonInfoURL');
const FACEBOOK_MESSENGER_PROFILE_URL = config.get('facebookMessengerProfile');

module.exports.setupFBMessenger = async (app) => {
    const messagebusSender = await messagebus;
    //  database.companyAPI.updateByCompanyID({companyId:'1', chatbotAPIUUId:'4LSN2MYVWVUM2QHOX73Q', chatbotBusId:'2', pageAccessToken:'EAABcynYQzfQBAAX6Y53mOuWgIGGnb0v02XjMjCCq827eRQ1G7lYghLPCgOD5MhZAOjSSfli22GabZCh4j5YTOqKZAgyO1MTiQ6b0thB9XgQFrPRQXFbgt0LjeXmXWYTDqZCvUt3takQa0EJWmMe5lZC8XSZCLV2NvOlO8YhzJwGZACFUpDF9XIdtDsF7FcnTScZD', appSecret:'6140495b9add8466ad1e802b8f0f467f'});

    /*
        These are all the incoming messages that can be sent to Facebook Messenger.
    */
    onMessageFnc = async (msg) => {
        if (logger.isDebugEnabled()) {
            logger.debug(`Received message for facebook\n ${JSON.stringify(msg)}`);
        }

        if (!msg) {
            logger.error("Message was null");
            return;
        }

        if (!msg.chatbotAPIUUId) {
            logger.error("Message had an empty API UUId");
            return;
        }

        if (!msg.msgId) {
            logger.error("Message had an empty message Id");
            return;
        }

        const apiConfig = await database.companyAPI.findByAPIUUId(msg.chatbotAPIUUId);
        if (!apiConfig) {
            logger.error("Could not find chatbot API UUId: ", msg.chatbotAPIUUId);
            messagebusSender(fbMessageStatusReport(
                msg.msgId,
                apiConfig.chatbotBusId,
                "Could not find chatbot API UUId: " + msg.chatbotAPIUUId,
                STATUS.NOT_VALID_APIUUID
            ));
            return;
        }
        try {
            //sendTypingOff(msg.senderId, apiConfig.pageAccessToken);
            if (msg.msgType === Symbol.keyFor(MSG_TYPES.FB_MSG_REPLY_PLAIN_TXT)) {
                sendTextMessage(msg.msgId, apiConfig.chatbotBusId, msg.senderId, apiConfig.pageAccessToken, msg.messageText, msg.msgId);
            } else if (msg.msgType === Symbol.keyFor(MSG_TYPES.FB_MSG_MEDIA)) {
                sendMediaMessage(msg.msgId, apiConfig.chatbotBusId, msg.senderId, apiConfig.pageAccessToken, msg.type, msg.assetPath);
            } else if (msg.msgType === Symbol.keyFor(MSG_TYPES.FB_MSG_BUTTON)) {
                sendButtonMessage(msg.msgId, apiConfig.chatbotBusId, msg.senderId, apiConfig.pageAccessToken, msg.headerText, msg.buttons)
            } else if (msg.msgType === Symbol.keyFor(MSG_TYPES.FB_MSG_GENERIC)) {
                sendGenericMessage(msg.msgId, apiConfig.chatbotBusId, msg.senderId, apiConfig.pageAccessToken, msg.elements);
            } else if (msg.msgType === Symbol.keyFor(MSG_TYPES.FB_MSG_QUICK_REPLY)) {
                sendQuickReply(msg.msgId, apiConfig.chatbotBusId, msg.senderId, apiConfig.pageAccessToken, msg.question, msg.replies);
            } else if (msg.msgType === Symbol.keyFor(MSG_TYPES.FB_MSG_ADD_PROFILE)) {
                callAddToMessengerProfileAPI(msg.msgId, apiConfig.chatbotBusId, msg.profile, apiConfig.pageAccessToken);
            } else if (msg.msgType === Symbol.keyFor(MSG_TYPES.FB_MSG_DEL_PROFILE)) {
                callDeleteMessengerProfileAPI(msg.msgId, apiConfig.chatbotBusId, msg.profile, apiConfig.pageAccessToken);
            } else {
                logger.error(`Unknown message type received:\n ${JSON.stringify(msg)}`);
                messagebusSender(fbMessageStatusReport(
                    msg.msgId,
                    apiConfig.chatbotBusId,
                    "Unknown message type received: " + msg.msgType,
                    STATUS.UNKNOWN_MSG_TYPE
                ));
            }
        } catch (Err) {
            logger.error(`Unknown message error received:\n ${JSON.stringify(Err)}`);
            messagebusSender(fbMessageStatusReport(
                msg.msgId,
                apiConfig.chatbotBusId,
                "Unknown message error",
                STATUS.UNKNOWN_MSG_TYPE
            ));
        }

    }

    app.use(bodyParser.json({ verify: verifyRequestSignature }));

    /*
     * Use your own validation token. Check that the token used in the Webhook
     * setup is the same token used here.
     *
     */
    app.get('/:company/webhook', (req, res) => {
        if (req.query['hub.mode'] === 'subscribe') {
            database.companyAPI.findByAPIUUId(req.query['hub.verify_token']).then((obj) => {
                if (obj) {
                    res.status(200).send(req.query['hub.challenge']);
                } else {
                    res.sendStatus(403);
                }
            }).catch((err) => {
                res.sendStatus(403);
            });
        } else {
            res.sendStatus(403);
        }
    });


    /*
     * All callbacks for Messenger are POST-ed. They will be sent to the same
     * webhook. Be sure to subscribe your app to your page to receive callbacks
     * for your page.
     * https://developers.facebook.com/docs/messenger-platform/product-overview/setup#subscribe_app
     *
     */
    app.post('/:apiuuid/webhook', async (req, res) => {
        try {
            const data = req.body;
            if (logger.isDebugEnabled()) {
                logger.debug(`Received message from facebook messanger\n ${JSON.stringify(data)}`);
            }

            const apiConfig = await database.companyAPI.findByAPIUUId(req.params.apiuuid);
            if (!apiConfig) {
                logger.error("Company API UUID not in the database:", req.params.apiuuid);
                res.sendStatus(200);
                return;
            }

            // Make sure this is a page subscription
            if (data.object === 'page') {
                // Iterate over each entry
                // There may be multiple if batched
                data.entry.forEach((pageEntry) => {
                    const pageID = pageEntry.id;
                    const timeOfEvent = pageEntry.time;

                    // Iterate over each messaging event
                    pageEntry.messaging.forEach(async (messagingEvent) => {
                        if (messagingEvent.optin) {
                            receivedAuthentication(apiConfig, pageID, timeOfEvent, messagingEvent);
                        } else if (messagingEvent.message) {
                            await receivedMessage(apiConfig, pageID, timeOfEvent, messagingEvent);
                        } else if (messagingEvent.delivery) {
                            receivedDeliveryConfirmation(apiConfig, pageID, timeOfEvent, messagingEvent);
                        } else if (messagingEvent.postback) {
                            receivedPostback(apiConfig, pageID, timeOfEvent, messagingEvent);
                        } else if (messagingEvent.read) {
                            receivedMessageRead(apiConfig, pageID, timeOfEvent, messagingEvent);
                        } else {
                            logger.error("Webhook received unknown messagingEvent: ", messagingEvent);
                        }
                    });
                });
                // Assume all went well.
                // You must send back a 200, within 20 seconds, to let us know you've
                // successfully received the callback. Otherwise, the request will time out.
                // and possible disconnect the service entirely
            }
        } catch (err) {
            logger.error("Error handling facebook message", err);
        }

        res.sendStatus(200);
    });

    /*
     * This path is used for account linking. The account linking call-to-action
     * (sendAccountLinking) is pointed to this URL.
     *
     */
    app.get('/authorize', function (req, res) {
        var accountLinkingToken = req.query.account_linking_token;
        var redirectURI = req.query.redirect_uri;

        // Authorization Code should be generated per user by the developer. This will
        // be passed to the Account Linking callback.
        var authCode = "1234567890";

        // Redirect users to this URI on successful login
        var redirectURISuccess = redirectURI + "&authorization_code=" + authCode;

        res.render('authorize', {
            accountLinkingToken: accountLinkingToken,
            redirectURI: redirectURI,
            redirectURISuccess: redirectURISuccess
        });
    });

    /*
     * Verify that the callback came from Facebook. Using the App Secret from
     * the App Dashboard, we can verify the signature that is sent with each
     * callback in the x-hub-signature field, located in the header.
     *
     * https://developers.facebook.com/docs/graph-api/webhooks#setup
     *
     */
    async function verifyRequestSignature(req, res, buf) {
        const signature = req.headers["x-hub-signature"];
        const chatbotAPIUUId = req.originalUrl.split('/')[1];

        if (!signature) {
            // For testing, let's log an error. In production, you should throw an
            // error.
            console.error("Couldn't validate the signature.");
        } else {
            const elements = signature.split('=');
            const method = elements[0];
            const signatureHash = elements[1];
            const apiConfig = await database.companyAPI.findByAPIUUId(chatbotAPIUUId);
            if (apiConfig) {
                const expectedHash = crypto.createHmac('sha1', apiConfig.appSecret)
                    .update(buf)
                    .digest('hex');

                if (signatureHash != expectedHash) {
                    res.status(403).send({ error: "Invalid signature." });
                    throw new Error("Couldn't validate the request signature.");
                }

            } else {
                res.status(403).send({ error: "Invalid signature." });
                throw new Error("Couldn't validate the request signature.");
            }
        }
    }

    /*
     * Authorization Event
     *
     * The value for 'optin.ref' is defined in the entry point. For the "Send to
     * Messenger" plugin, it is the 'data-ref' field. Read more at
     * https://developers.facebook.com/docs/messenger-platform/webhook-reference/authentication
     *
     */
    async function receivedAuthentication(apiConfig, pageID, timeOfEvent, event) {
        const senderId = event.sender.id;
        const recipientId = event.recipient.id;
        const timeOfAuth = event.timestamp;

        // The 'ref' field is set in the 'Send to Messenger' plugin, in the 'data-ref'
        // The developer can set this to an arbitrary value to associate the
        // authentication callback with the 'Send to Messenger' click event. This is
        // a way to do account linking when the user clicks the 'Send to Messenger'
        // plugin.
        const passThroughParam = event.optin.ref;

        if (logger.isDebugEnabled()) {
            logger.debug(`Received optin: ${JSON.stringify(event)}`);
        }

        messagebusSender(fbMessageOptIn(
            apiConfig.chatbotBusId,
            apiConfig.chatbotAPIUUId,
            pageId,
            senderId,
            recipientId,
            timeOfEvent,
            optinRef
        ));
    }

    /*
     * Message Event
     *
     * This event is called when a message is sent to your page. The 'message'
     * object format can vary depending on the kind of message that was received.
     * Read more at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-received
     *
     * For this example, we're going to echo any text that we get. If we get some
     * special keywords ('button', 'generic', 'receipt'), then we'll send back
     * examples of those bubbles to illustrate the special message bubbles we've
     * created. If we receive a message with an attachment (image, video, audio),
     * then we'll simply confirm that we've received the attachment.
     *
     */
    async function receivedMessage(apiConfig, pageID, timeOfEvent, event) {
        const senderId = event.sender.id;
        const recipientId = event.recipient.id;
        const timeOfMessage = event.timestamp;
        const message = event.message;
        const messageId = message.mid;
        const appId = message.app_id;
        const chatSessionData = message.metadata;
        // You may get a text or attachment but not both
        const messageText = message.text;

        if (logger.isDebugEnabled()) {
            logger.debug(`Received message from: ${JSON.stringify(event)}`);
        }

        if (message.attachments || message.is_echo) {
            //can't handle these at this time
            return
        }

        const quickReply = message.quick_reply;
        let choiceOptions = null;
        if (quickReply) {
            choiceOptions = quickReply.payload;
        }

        const person = await callGetPersonInfo(senderId, apiConfig.pageAccessToken);
        messagebusSender(fbNewMsg(
            apiConfig.chatbotBusId,
            apiConfig.chatbotAPIUUId,
            pageID,
            senderId,
            recipientId,
            timeOfMessage,
            messageId,
            appId,
            chatSessionData,
            messageText,
            choiceOptions,
            person.first_name,
            person.last_name,
            person.gender
        ));
        sendReadReceipt(senderId, apiConfig.pageAccessToken);
        sendTypingOn(senderId, apiConfig.pageAccessToken);
    }


    /*
     * Delivery Confirmation Event
     *
     * This event is sent to confirm the delivery of a message. Read more about
     * these fields at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-delivered
     *
     */
    function receivedDeliveryConfirmation(apiConfig, pageId, timeOfEvent, event) {
        const senderId = event.sender.id;
        const recipientId = event.recipient.id;
        const delivery = event.delivery;
        const messageIds = delivery.mids;
        const watermark = delivery.watermark;
        const sequenceNumber = delivery.seq;

        if (messageIds) {
            messageIds.forEach((messageId) => {

                logger.debug(`Received delivery confirmation for message Id: ${messageId}`);

                messagebusSender(fbDelConfirmation(
                    apiConfig.chatbotBusId,
                    apiConfig.chatbotAPIUUId,
                    pageId,
                    senderId,
                    recipientId,
                    timeOfEvent,
                    messageId,
                    watermark,
                    sequenceNumber
                ));
            });
        }
    }


    /*
     * Postback Event
     *
     * This event is called when a postback is tapped on a Structured Message.
     * https://developers.facebook.com/docs/messenger-platform/webhook-reference/postback-received
     *
     */
    function receivedPostback(apiConfig, pageId, timeOfEvent, event) {
        const senderId = event.sender.id;
        const recipientId = event.recipient.id;
        const timeOfPostback = event.timestamp;

        // The 'payload' param is a developer-defined field which is set in a postback
        // button for Structured Messages.
        const payload = event.postback.payload;
        if (logger.isDebugEnabled()) {
            logger.debug(`Received postback message from: ${JSON.stringify(event)}`);
        }

        messagebusSender(fbPostback(
            apiConfig.chatbotBusId,
            apiConfig.chatbotAPIUUId,
            pageId,
            senderId,
            recipientId,
            timeOfPostback,
            payload
        ));

        sendReadReceipt(senderId, apiConfig.pageAccessToken);
        sendTypingOn(senderId, apiConfig.pageAccessToken);
    }

    /*
     * Message Read Event
     *
     * This event is called when a previously-sent message has been read.
     * https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-read
     *
     */
    function receivedMessageRead(apiConfig, pageId, timeOfEvent, event) {
        const senderId = event.sender.id;
        const recipientId = event.recipient.id;
        // All messages before watermark (a timestamp) or sequence have been seen.
        const watermark = event.read.watermark;
        const sequenceNumber = event.read.seq;

        if (logger.isDebugEnabled()) {
            logger.debug(`Received message read: ${JSON.stringify(event)}`);
        }

        messagebusSender(fbMessageRead(
            apiConfig.chatbotBusId,
            apiConfig.chatbotAPIUUId,
            pageId,
            senderId,
            recipientId,
            timeOfEvent,
            watermark,
            sequenceNumber
        ));
    }

    /*
     * Send an media to chat. Types are: image, audio, video, and file
     *
     */
    function sendMediaMessage(msgId, recipientId, pageAccessToken, type, assetPath) {
        const messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                attachment: {
                    type,
                    payload: {
                        url: SERVER_URL + '/' + assetPath
                    }
                }
            }
        };

        callSendToMessengerAPI(msgId, messageData, pageAccessToken);
    }

    /*
     * Send a text message using the Send API.
     *
     */
    function sendTextMessage(msgId, chatbotBusId, recipientId, pageAccessToken, messageText, sessionInfo) {
        const messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                text: messageText,
                metadata: sessionInfo
            }
        };

        callSendToMessengerAPI(msgId, chatbotBusId, messageData, pageAccessToken);
    }

    /*
     * Send a button message using the Send API.
     * types are: web_url, postback, phone_number
     * buttons: [{
                            type: "web_url",
                            url: "https://www.oculus.com/en-us/rift/",
                            title: "Open Web URL"
                        }, {
                            type: "postback",
                            title: "Trigger Postback",
                            payload: "DEVELOPER_DEFINED_PAYLOAD"
                        }, {
                            type: "phone_number",
                            title: "Call Phone Number",
                            payload: "+16505551234"
                        }]
     *
     */
    function sendButtonMessage(msgId, chatbotBusId, recipientId, pageAccessToken, headerText, buttons) {
        const messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                attachment: {
                    type: "template",
                    payload: {
                        buttons,
                        template_type: "button",
                        text: headerText
                    }
                }
            }
        };

        callSendToMessengerAPI(msgId, chatbotBusId, messageData, pageAccessToken);
    }

    /*
     * Send a Structured Message (Generic Message type) using the Send API.
     *                elements: [{
                            title: "rift",
                            subtitle: "Next-generation virtual reality",
                            item_url: "https://www.oculus.com/en-us/rift/",
                            image_url: SERVER_URL + "/assets/rift.png",
                            buttons: [{
                                type: "web_url",
                                url: "https://www.oculus.com/en-us/rift/",
                                title: "Open Web URL"
                            }, {
                                type: "postback",
                                title: "Call Postback",
                                payload: "Payload for first bubble",
                            }],
                        }, {
                            title: "touch",
                            subtitle: "Your Hands, Now in VR",
                            item_url: "https://www.oculus.com/en-us/touch/",
                            image_url: SERVER_URL + "/assets/touch.png",
                            buttons: [{
                                type: "web_url",
                                url: "https://www.oculus.com/en-us/touch/",
                                title: "Open Web URL"
                            }, {
                                type: "postback",
                                title: "Call Postback",
                                payload: "Payload for second bubble",
                            }]
                        }]
     */
    function sendGenericMessage(msgId, chatbotBusId, recipientId, pageAccessToken, elements) {
        const messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                attachment: {
                    type: "template",
                    payload: {
                        elements,
                        template_type: "generic"
                    }
                }
            }
        };

        callSendToMessengerAPI(msgId, chatbotBusId, messageData, pageAccessToken);
    }

    /*
     * Send a message with Quick Reply buttons.
     *              [{
                        "content_type": "text",
                        "title": "Action",
                        "payload": "DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_ACTION"
                    }]
     */
    function sendQuickReply(msgId, chatbotBusId, recipientId, pageAccessToken, question, replies) {
        const messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                text: question,
                quick_replies: replies
            }
        };

        callSendToMessengerAPI(msgId, chatbotBusId, messageData, pageAccessToken);
    }

    /*
     * Send a read receipt to indicate the message has been read
     *
     */
    function sendReadReceipt(senderID, pageAccessToken) {
        console.log("Sending a read receipt to mark message as seen");

        const messageData = {
            recipient: {
                id: senderID
            },
            sender_action: "mark_seen"
        };

        callSendToMessengerAPI(0, 0, messageData, pageAccessToken);
    }

    /*
     * Turn typing indicator on
     *
     */
    function sendTypingOn(senderId, pageAccessToken) {
        console.log("Turning typing indicator on");

        const messageData = {
            recipient: {
                id: senderId
            },
            sender_action: "typing_on"
        };

        callSendToMessengerAPI(0, 0, messageData, pageAccessToken);
    }

    /*
     * Turn typing indicator off
     *
     */
    function sendTypingOff(senderId, pageAccessToken) {
        console.log("Turning typing indicator off");

        const messageData = {
            recipient: {
                id: senderId
            },
            sender_action: "typing_off"
        };

        callSendToMessengerAPI(0, 0, messageData, pageAccessToken);
    }

    /*
     * Call the Send API. The message data goes in the body. If successful, we'll
     * get the message id in a response
     *
     */
    function callSendToMessengerAPI(msgId, chatbotBusId, messageData, pageAccessToken) {
        request({
            uri: FACEBOOK_STD_MSG_API_URL,
            qs: { access_token: pageAccessToken },
            method: 'POST',
            json: messageData

        }, (error, response, body) => {
            if (!error && response.statusCode == 200) {
                const recipientId = body.recipient_id;
                const messageId = body.message_id;

                if (logger.isDebugEnabled()) {
                    logger.debug("Successfully sent message: ", JSON.stringify(messageData));
                }
                if (msgId !== 0) {
                    messagebusSender(fbMessageStatusReport(msgId, chatbotBusId));
                }

            } else {
                logger.error(`Failed calling API ${response.statusCode} : ${JSON.stringify(response.statusMessage)} : ${JSON.stringify(body)}`);
                if (msgId !== 0) {
                    messagebusSender(fbMessageStatusReport(
                        msgId,
                        chatbotBusId,
                        "sending msg to facebook",
                        STATUS.SEND_TO_MSGR_API_FAILED
                    ));
                }
            }
        });
    }

    function callGetPersonInfo(senderId, pageAccessToken) {
        return new Promise((resolve, reject) => {
            request({
                uri: FACEBOOK_PERSON_INFO_API_URL + senderId,
                qs: { fields: 'first_name,last_name,gender', access_token: pageAccessToken },
                method: 'GET'
            }, (error, response, body) => {
                if (!error && response.statusCode == 200) {
                    if (logger.isDebugEnabled()) {
                        logger.debug("Successfully got person info: ", JSON.stringify(response.body));
                    }
                    resolve(JSON.parse(response.body));
                } else {
                    logger.error(`Failed calling API ${response.statusCode} : ${JSON.stringify(response.statusMessage)} : ${JSON.stringify(body)}`);
                    reject(Error(response.statusMessage + ':' + response.statusCode));
                }
            });
        });
    }

    /*

    */
    function callAddToMessengerProfileAPI(msgId, chatbotBusId, messageData, pageAccessToken) {
        request({
            uri: FACEBOOK_MESSENGER_PROFILE_URL,
            qs: { access_token: pageAccessToken },
            method: 'POST',
            json: messageData

        }, (error, response, body) => {
            if (!error && response.statusCode == 200) {
                if (logger.isDebugEnabled()) {
                    logger.debug("Successfully added profile: ", JSON.stringify(messageData));
                }
                messagebusSender(fbMessageStatusReport(msgId, chatbotBusId));
            } else {
                logger.error(`Failed calling API ${response.statusCode} : ${JSON.stringify(response.statusMessage)} : ${JSON.stringify(body)}`);
                messagebusSender(fbMessageStatusReport(
                    msgId,
                    chatbotBusId,
                    "Adding profile failed",
                    STATUS.ADDING_PROFILE_FAILED
                ));
            }
        });
    }

    /*

    */
    function callDeleteMessengerProfileAPI(msgId, chatbotBusId, messageData, pageAccessToken) {
        request({
            uri: FACEBOOK_MESSENGER_PROFILE_URL,
            qs: { access_token: pageAccessToken },
            method: 'DELETE',
            json: messageData

        }, (error, response, body) => {
            if (!error && response.statusCode == 200) {
                if (logger.isDebugEnabled()) {
                    logger.debug("Successfully deleted profile: ", JSON.stringify(messageData));
                }
                messagebusSender(fbMessageStatusReport(msgId, chatbotBusId));
            } else {
                logger.error(`Failed calling API ${response.statusCode} : ${JSON.stringify(response.statusMessage)} : ${JSON.stringify(body)}`);
                messagebusSender(fbMessageStatusReport(
                    msgId,
                    chatbotBusId,
                    "Delete profile failed",
                    STATUS.DELETE_PROFILE_FAILED
                ));
            }
        });
    }

};