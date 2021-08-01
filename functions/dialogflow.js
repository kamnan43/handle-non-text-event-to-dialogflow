const functions = require("firebase-functions");
const request = require('request');
const crypto = require('crypto');

const config = {
  agentId: functions.config().dialogflow.agent_id,
  channelSecret: functions.config().line.channel_secret
}

function postToDialogflow(req) {
  req.headers.host = "dialogflow.cloud.google.com";
  return request.post({
    uri: `https://dialogflow.cloud.google.com/v1/integrations/line/webhook/${config.agentId}`,
    headers: req.headers,
    body: JSON.stringify(req.body)
  });
};

function convertToDialogflow(req, body) {
  const jsonBody = JSON.stringify(body);
  req.headers.host = "dialogflow.cloud.google.com";
  req.headers["x-line-signature"] = calculateLineSignature(jsonBody);
  req.headers["content-length"] = jsonBody.length;
  return request.post({
    uri: `https://dialogflow.cloud.google.com/v1/integrations/line/webhook/${config.agentId}`,
    headers: req.headers,
    body: jsonBody
  });
};

function calculateLineSignature(body) {
  const signature = crypto
    .createHmac('SHA256', config.channelSecret)
    .update(body).digest('base64');
  return signature;
}

function createLineTextEvent(originalRequest, originalEvent, text) {
  return {
    events:
      [{
        type: 'message',
        replyToken: originalEvent.replyToken,
        source: originalEvent.source,
        timestamp: originalEvent.timestamp,
        mode: originalEvent.mode,
        message: {
          type: 'text',
          text,
        },
      }],
    destination: originalRequest.body.destination,
  };
}

module.exports = {
  postToDialogflow,
  convertToDialogflow,
  createLineTextEvent,
}