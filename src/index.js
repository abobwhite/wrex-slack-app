const dotenv = require('dotenv');
const {App} = require('@slack/bolt');

dotenv.config();

const app = new App({
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    token: process.env.SLACK_BOT_TOKEN,
});

// The echo command simply echoes on command
app.command('/echo', async ({ command, ack, say }) => {
    console.log("echoing");
    // Acknowledge command request
    ack();

    say(`${command.text}`);
});

app.message(':wave:', async ({ message, say}) => {
    console.log("saying hi");
    say(`Hello, <@${message.user}>`);
});

(async () => {
    await app.start(process.env.PORT || 3000);

    console.log('⚡️ Bolt app is running!');
})();
