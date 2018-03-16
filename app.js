/* jshint node: true, devel: true */
'use strict';

const
  config = require('config'),
  express = require('express'),
  https = require('https'),
  fs = require("fs"),
  fbMsgr = require("./facebook/fbmessenger"),
  logger = require('./utils/logger')(__dirname, "app");

const app = express();
app.use(express.static('public'));
fbMsgr.setupFBMessenger(app);

const options = {
  key: fs.readFileSync(config.get('restSSLKey')),
  cert: fs.readFileSync(config.get('restSSLCert')),
  ca: [fs.readFileSync(config.get('restSSLCA'))]
};

const server = https.createServer(options, app).listen(config.get('servicePort'), "0.0.0.0", () => {
  logger.info("svr-fbchatbot-fwd listening 0.0.0.0:" + config.get('servicePort'));
});
server.maxConnections = config.get('maxIncomingCnx');
server.on('error', (err) => {
  logger.error("Server error", err)
});