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

// Matches "/auth"
bot.onText(/\/auth/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    "Incorrect command.\nCorrect: /auth client_id, redirect_uri"
  );
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

  const validMessage = resp.split(",").map((elem) => elem.trim());
  const client_id = validMessage[0],
    redirect_uri = validMessage[1];
  bot.sendMessage(
    chatId,
    "Auth in Instagram account and don't close the opeopened tab.\nAfter success login send this:\n/create client_id, client_secret, redirect_uri, URL_FROM_PAGE",
    {
      reply_markup: JSON.stringify({
        inline_keyboard: [
          [
            {
              text: "Login Instagram",
              url: `https://api.instagram.com/oauth/authorize?client_id=${client_id}&redirect_uri=${redirect_uri}&scope=user_profile,user_media&response_type=code`,
            },
          ],
        ],
      }),
    }
  );
});

// Matches "/create"
bot.onText(/\/create/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    "Incorrect command.\nCorrect: /create client_id, client_secret, redirect_uri, URL_FROM_PAGE"
  );
});

// Matches "/create [whatever]"
bot.onText(/\/create (.+)/, (msg, match) => {
  // https://api.instagram.com/oauth/access_token?&client_id={app-id}&client_secret={app-secret}&grant_type=authorization_code&redirect_uri={redirect-uri}&code={code}
  const chatId = msg.chat.id;
  const resp = match[1]; // the captured "whatever"

  try {
    const validMessage = resp.split(",").map((elem) => elem.trim());
    const client_id = validMessage[0],
      client_secret = validMessage[1],
      redirect_uri = validMessage[2],
      URL_FROM_PAGE =
        validMessage[3] !== "URL_FROM_PAGE" &&
        validMessage[3].split("code=").length !== 0
          ? validMessage[3].split("code=")[1].split("#_")[0]
          : null;
    bot.sendMessage(chatId, "Loading...");

    Axios.post(
      `https://api.instagram.com/oauth/access_token?client_id=${client_id}&client_secret=${client_secret}&grant_type=authorization_code&redirect_uri=${redirect_uri}&code=${URL_FROM_PAGE}`
    )
      .then((res) => {
        console.log("res :>> ", res);
        bot.sendMessage(chatId, res.data);
      })
      .catch((err) => {
        console.log("err :>> ", err);
        bot.sendMessage(
          chatId,
          `${err.data.code}. ${err.data.error_message} (${err.data.error_type})`
        );
      });
  } catch (error) {
    console.log("error :>> ", error);
    bot.sendMessage(chatId, error);
  }

  // bot.sendMessage(
  //   chatId,
  //   "Auth in Instagram account and don't close the opeopened tab.\nAfter success login send this:\n/create client_id, client_secret, redirect_uri, URL_FROM_PAGE",
  //   {
  //     reply_markup: JSON.stringify({
  //       inline_keyboard: [
  //         [
  //           {
  //             text: "Login Instagram",
  //             url: `https://api.instagram.com/oauth/authorize?client_id=${client_id}&redirect_uri=${redirect_uri}&scope=user_profile,user_media&response_type=code`,
  //           },
  //         ],
  //       ],
  //     }),
  //   }
  // );
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
