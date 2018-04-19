'use strict';

const app = require('chatbot-common').serviceAPP,
    fbMsgr = require("./facebook/fbmessenger");

//incoming from Facebook messanger API
fbMsgr.setupFBMessenger(app);