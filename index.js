process.env.NTBA_FIX_319 = 1;
import TelegramBot from "node-telegram-bot-api";
import Koa from "koa";
import Router from "koa-router";
import bodyParser from "koa-bodyparser";

let action = null;

// Main insta config
const instaConfig = {
  redirect_uri: {
    value: null,
    text: "Valid redirect URIs for OAuth",
  },
  client_id: {
    value: null,
    text: "Instagram app ID",
  },
  client_secret: {
    value: null,
    text: "The secret of the Instagram app",
  },
  code: {
    value: null,
    text: "Put here link after success loggin.",
  },
  access_token: {
    value: null,
    text: null,
  },
  user_id: {
    value: null,
    text: null,
  },
  access_token: {
    value: null,
    text: null,
  },
  token_type: "bearer",
  expires_in: {
    value: null,
    text: null,
  },
};

const createToken = (chatId, text) => {
  for (const prop in instaConfig) {
    if (instaConfig[prop].text !== null) {
      // console.log("obj." + prop + " = " + instaConfig[prop].value);
      bot.sendMessage(chatId, instaConfig[prop].text);
    }
  }
};

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

// Listen for any kind of message. There are different kinds of
// messages.
bot.on("message", (msg) => {
  const chatId = msg.chat.id;

  console.log("action :>> ", action);

  switch (action) {
    case "create":
      createToken(chatId, msg.text);
      break;
    case "update":
      bot.sendMessage(chatId, "in developing... Try something else.");
      break;

    default:
      break;
  }
});

// Matches "/create [whatever]"
bot.onText(/\/create (.+)/, (msg, match) => {
  action = "create";
  const chatId = msg.chat.id;
  const resp = match[1]; // the captured "whatever"

  // send back the matched "whatever" to the chat
  bot.sendMessage(chatId, resp);
});

// Matches "/update [whatever]"
bot.onText(/\/update (.+)/, (msg, match) => {
  action = "update";
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
  action = "donate";
});
