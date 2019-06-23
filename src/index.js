const dotenv = require('dotenv');
const {App, LogLevel} = require('@slack/bolt');
const axios = require('axios')


dotenv.config();

const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN,
  logLevel: LogLevel.DEBUG,
});

(async () => {
  const port = process.env.PORT || 3000;
  const server = await app.start(port);
  console.log('⚡️ Bolt app is running!', server.address());
})();

// The echo command simply echoes on command
app.command('/echo', async ({command, ack, say}) => {
  // Acknowledge command request
  ack();
  say(`${command.text}`);
});

app.command('/whoami', async ({command, ack, say}) => {
  ack();
  say(`Team Id: ${command.team_id}\nUser Id: ${command.user_id}\nUsername: ${command.user_name}`);
});

app.command('/wrexy', async ({command, ack, say}) => {
  ack();
  axios.post(`http://165.22.45.117:8081/users/${command.user_id}/statuses`, {message: command.text});
  say(`If this was hooked up I'd have sent this somewhere: ${command.text}`);
});

app.message(':wave:', async ({message, say}) => {
  console.log("saying hi");
  say(`Hello, <@${message.user}>`);
});

