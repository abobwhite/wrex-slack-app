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
  setupTrigger(app);
  console.log('⚡️ Bolt app is running!', server.address());
})();

app.command('/whoami', async ({command, ack, say}) => {
  ack();
  say(`Team Id: ${command.team_id}\nUser Id: ${command.user_id}\nUsername: ${command.user_name}`);
});

app.command('/wrexy', async ({command, ack, say}) => {
  console.log(server);
  ack();
  try {
    await axios.post(`http://165.22.45.117/api/users/${command.user_id}/statuses`, {message: command.text});
    say(`Thanks! I posted that status to the app for you!`)
  } catch {
    say(`Uh-oh! That status didn't go through. Can you try again?`);
  }
});

const setupTrigger = (app) => {
    app.receiver.app.post('/trigger/:userId', function (req, res) {
        res.send(`Prompt user ${req.params.userId}`);
    })
};
