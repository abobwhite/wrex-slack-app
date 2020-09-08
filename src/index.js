const dotenv = require('dotenv');
const {App, LogLevel} = require('@slack/bolt');
const axios = require('axios');

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
    setupTrigger();
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

app.command('/wrexy-list', async ({command, ack, respond}) => {
    ack();
    try {
        const statusResponse = await axios.get(`${API_ROOT}/users/${command.user_id}/statuses`);
        const statuses = statusResponse.data.reduce((previous, current) => `${previous}\n* ${current.message}`, 'Statuses\n--------\n');
        console.log(`Retrieved statuses: ${statuses}`);
        respond({response_type:'ephemeral' , text:statuses})
    } catch {
        respond({response_type: 'ephemeral', text: `Uh-oh! That didn't work!`});
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

const setupTrigger = () => {
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
};
