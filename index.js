process.env.NTBA_FIX_319 = 1;
import TelegramBot from "node-telegram-bot-api";
import Koa from "koa";
import Router from "koa-router";
import bodyParser from "koa-bodyparser";
import Axios from "axios";

// replace the value below with the Telegram token you receive from @BotFather
const token = process.env.BOT_TOKEN;

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token);
bot.setWebHook(`${process.env.URL}/bot`);

const app = new Koa();

const router = new Router();
router.post("/bot", (ctx) => {
  const { body } = ctx.request;
  bot.processUpdate(body);
  ctx.status = 200;
});

app.use(bodyParser());
app.use(router.routes());

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Listening on ${port}`);
});

// Matches "/auth [whatever]"
bot.onText(/\/auth (.+)/, (msg, match) => {
  /*
    https://api.instagram.com/oauth/authorize
    ?client_id=client_id
    &redirect_uri=redirect_uri
    &scope=user_profile,user_media
    &response_type=code
   */

  const chatId = msg.chat.id;
  const resp = match[1]; // the captured "whatever"

  if (resp === undefined) {
    bot.sendMessage(chatId, "Incorrect message.");
  } else {
    const validMessage = resp.split(",").map((elem) => elem.trim());
    const client_id = validMessage[0],
      redirect_uri = validMessage[1];
    bot.sendMessage(chatId, "Loading...");

    Axios.get(
      `https://api.instagram.com/oauth/authorize
    ?client_id=${client_id}
    &redirect_uri=${redirect_uri}
    &scope=user_profile,user_media
    &response_type=code`
    ).then((res) => {
      bot.sendMessage(chatId, res.data);
    });
  }
  // send back the matched "whatever" to the chat
  bot.sendMessage(chatId, resp);
});

// Matches "/create [whatever]"
bot.onText(/\/create (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const resp = match[1]; // the captured "whatever"

  // send back the matched "whatever" to the chat
  bot.sendMessage(chatId, resp);
});

// Matches "/update [whatever]"
bot.onText(/\/update (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const resp = match[1]; // the captured "whatever"

  // send back the matched "whatever" to the chat
  bot.sendMessage(chatId, resp);
});

const donateOptions = {
  reply_markup: JSON.stringify({
    inline_keyboard: [
      [
        {
          text: "Donate",
          url: "https://donate.stream/donate_5ea45443aa113",
        },
      ],
    ],
  }),
};

// Matches "/donate"
bot.onText(/\/donate/, (msg) => {
  const chatId = msg.chat.id;

  // send back the matched "whatever" to the chat
  bot.sendMessage(chatId, "Thanks for Donate 🔥", donateOptions);
});
