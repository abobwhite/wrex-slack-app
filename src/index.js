const dotenv = require('dotenv');
const {App, LogLevel} = require('@slack/bolt');
const axios = require('axios');
const bodyParser = require('body-parser');

dotenv.config();

const API_ROOT = 'http://wrex.rocks/api';

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const app = new App({
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    token: SLACK_BOT_TOKEN,
    logLevel: LogLevel.DEBUG,
});

(async () => {
    const port = process.env.PORT || 3000;
    const server = await app.start(port);
    setupCustomEndpoints();
    console.log('⚡️ Bolt app is running!', server.address());
})();

app.command('/whoami', async ({command, ack, respond}) => {
    ack();
    respond({response_type: 'ephemeral', text: `Team Id: ${command.team_id}\nUser Id: ${command.user_id}\nUsername: ${command.user_name}`});
});

app.command('/wrexy', async ({command, ack, respond}) => {
    ack();
    try {
        await axios.post(`${API_ROOT}/users/${command.user_id}/statuses`, {message: command.text});
        respond({response_type:'ephemeral' , text:`Thanks! I posted that status to the app for you!`})
    } catch {
        respond({response_type: 'ephemeral', text: `Uh-oh! That status didn't go through. Can you try again?`});
    }
});

app.command('/wrexy-statuses', async ({command, ack, respond}) => {
    ack();
    try {
        const statusResponse = await axios.get(`${API_ROOT}/users/${command.user_id}/statuses`);
        const statuses = statusResponse.data.reduce((previous, current) => `${previous}\n* ${current.message}`, 'Statuses\n--------\n');
        console.log(`Retrieved statuses: ${statuses}`);
        respond({response_type:'ephemeral' , text:statuses})
    } catch {
        respond({response_type: 'ephemeral', text: `Uh-oh! I couldn't find your statuses!`});
    }
});

app.command('/wrexy-wrex', async ({command, ack, respond}) => {
    ack();
    try {
        const recommendationResponse = await axios.get(`${API_ROOT}/users/${command.user_id}/recommendations`);
        // Temp html replacement
        const recommendations = recommendationResponse.data.reduce((previous, current) => `${previous}\n* ${current.message.replace('<b>', '*').replace('</b>', '*')}`, 'Recommendations\n--------\n');
        console.log(`Retrieved recommendations: ${recommendations}`);
        respond({response_type:'ephemeral' , text:recommendations})
    } catch {
        respond({response_type: 'ephemeral', text: `Uh-oh! I couldn't find your recommendations!`});
    }
});

// app.event('message', async ({event, message, say}) => {
//     // const channels = await app.client.im.list();
//     try {
//         // if (channels.map(x => x.channel_id).contains(event.channel)) {
//             console.log('message', event.user, message.text);
//             await axios.post(`${API_ROOT}/users/${event.user.id}/statuses`, {message: message.text});
//             say({response_type:'ephemeral' , text:`Thanks! I posted that status to the app for you!`})
//         // }
//     } catch {
//         say({response_type: 'ephemeral', text: `Uh-oh! That status didn't go through. Can you try again?`});
//     }
// });

const jsonParser = bodyParser.json();

const setupCustomEndpoints = () => {
    app.receiver.app.post('/prompt/:userId', async (req, res) => {
        const userId = req.params.userId;
        try {
            const conversation = await app.client.im.open({token: SLACK_BOT_TOKEN, user: userId});
            let prompts = [
                `Don't forget to update me with what you've been doing this week!`,
                `Haven't seen you in awhile. You still work here?`,
                `What’s going on at work? Maybe I can help`,
                `Did you do anything awesome today?`,
                `You up? What's been going on?`,
            ];
            await app.client.chat.postMessage({
                token: SLACK_BOT_TOKEN,
                channel: conversation.channel.id,
                text: prompts[Math.floor(Math.random()*prompts.length)]
            });
            res.status(200);
            res.send(`Prompted user ${userId}`);
        } catch (e) {
            console.log(e);
            res.status(500);
            res.send(`Failed to prompt user ${userId}`);
        }
    });

    app.receiver.app.post('/recommendation-notify/:userId', jsonParser, async (req, res) => {
        const userId = req.params.userId;
        const recommendations = req.body;
        try {
            const blocks = [
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: ':tada: I\'ve got new recommendations for you! Check them out!'
                    }
                },
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        // Temp html replacement
                        text: recommendations.map(rec => `• ${rec.replace('<b>', '*').replace('</b>', '*')}`).join('\n')
                    }
                }
            ];
            const conversation = await app.client.im.open({token: SLACK_BOT_TOKEN, user: userId});
            await app.client.chat.postMessage({
                token: SLACK_BOT_TOKEN,
                channel: conversation.channel.id,
                blocks
            });
            res.status(200);
            res.send(`Notified user ${userId} of recommendations`);
        } catch (e) {
            console.log(e);
            res.status(500);
            res.send(`Failed to notify user ${userId} of recommendations`);
        }
    });
};
