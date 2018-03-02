'use strict';

const
    dialogflow = require('dialogflow'),
    config = require('config'),
    uuid = require('uuid/v1');

//const languageCode = 'en-US';

module.exports.call = (token, languageCode, text) => {

    return new Promise((resolve, reject) => {

        const sessionClient = new dialogflow.SessionsClient({
            projectId: config.get('dfProjectId'),
            keyFilename: 'keys/google-cloud.json',
        });

        //let x = sessionClient.getProjectId((err, id) => {
        //   console.log('id:' + id);

        // }) 
        const sessionPath = sessionClient.sessionPath(config.get('dfProjectId'), uuid());
        const dfRequest = {
            session: sessionPath,
            queryInput: {
                text: {
                    text,
                    languageCode,
                },
            },
        };

        sessionClient
            .detectIntent(dfRequest)
            .then(responses => {
                console.log('Detected intent');
                const result = responses[0].queryResult;
                console.log(`  Query: ${result.queryText}`);
                console.log(`  Response: ${result.fulfillmentText}`);
                let fields = result.parameters.fields;

                //for (let o of entries(fields)) {
                //     console.log(o);
                // }

                if (result.intent) {
                    console.log(`  Intent: ${result.intent.displayName}`);
                } else {
                    console.log(`  No intent matched.`);
                }
                resolve("resolved");
            })
            .catch(err => {
                console.error('ERROR:', err);
                reject(err);
            });

    });
}

