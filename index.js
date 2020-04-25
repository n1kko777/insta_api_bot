process.env.NTBA_FIX_319 = 1;
import TelegramBot from "node-telegram-bot-api";
import Koa from "koa";
import Router from "koa-router";
import bodyParser from "koa-bodyparser";

// replace the value below with the Telegram token you receive from @BotFather
const token = process.env.BOT_TOKEN;

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token);
bot.setWebHook(`${process.env.URL}/bot${token}`);

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

  // send a message to the chat acknowledging receipt of their message
  bot.sendMessage(chatId, "Received your message");
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

// Matches "/donate [whatever]"
bot.onText(/\/donate (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const resp = match[1]; // the captured "whatever"

  // send back the matched "whatever" to the chat
  bot.sendMessage(chatId, resp);
});
