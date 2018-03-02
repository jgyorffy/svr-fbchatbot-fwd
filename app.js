/* jshint node: true, devel: true */
'use strict';

const
  config = require('config'),
  express = require('express'),
  https = require('https'),
  fs = require("fs"),
  fbMsgr = require("./facebook/messenger"),
  chatbot = require("./chatbot/dialogflow");
const logger = require('./utils/logger')(__dirname, "app");




const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));
fbMsgr.setupFBMessenger(app);


const options = {
  key: fs.readFileSync("keys/datapark_ddns_net.key.pem"),
  cert: fs.readFileSync("keys/datapark_ddns_net.pem"),
  ca: [fs.readFileSync("keys/datapark_ddns_net.ca-bundle")]
};

https.createServer(options, app).listen(8443);
logger.debug("fbChatbot listening on port 8443");

chatbot.call("token", 'en-US', 'Do you have a slot tomorrow afternoon?').then(response => {
  console.log('Got: ' + response);
  logger.debug('Got: ' + response);
}).catch(err => {
  console.error('ERROR:', err);
});

//sendGenericMessage("1729446440446938");
