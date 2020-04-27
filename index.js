process.env.NTBA_FIX_319 = 1;
import TelegramBot from "node-telegram-bot-api";
import Koa from "koa";
import Router from "koa-router";
import bodyParser from "koa-bodyparser";

const curl = new (require("curl-request"))();

const token = process.env.BOT_TOKEN;
// replace the value below with the Telegram token you receive from @BotFather

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

    curl
      .setBody({
        client_id: client_id,
        client_secret: client_secret,
        grant_type: "authorization_code",
        redirect_uri: redirect_uri,
        code: URL_FROM_PAGE,
      })
      .post("https://api.instagram.com/oauth/access_token")
      .then(({ statusCode, body }) => {
        if (statusCode != 400) {
          /*
          https://graph.instagram.com/access_token
          ?grant_type=ig_exchange_token
          &client_secret={instagram-app-secret}
          &access_token={short-lived-access-token}
          */
          const { access_token } = JSON.parse(body);
          bot.sendMessage(chatId, `Short token (1 hour): ${access_token}`);
          bot.sendMessage(chatId, `Loading...`);
          curl
            .setHeaders([
              "user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36",
            ])
            .get(
              `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${client_secret}&access_token=${access_token}`
            )
            .then(({ statusCode, body }) => {
              const { access_token, expires_in } = JSON.parse(body);
              var nexpires_in = new Date();
              nexpires_in.setSeconds(nexpires_in.getSeconds() + expires_in);

              bot.sendMessage(
                chatId,
                `statusCode ${statusCode}:\naccess_token: ${access_token}\nexpires_in: ${nexpires_in}`
              );
            })
            .catch((e) => {
              console.log("e :>> ", e);
              bot.sendMessage(chatId, e);
            });
        } else {
          bot.sendMessage(chatId, `statusCode ${statusCode}:\n${body}`);
        }
      })
      .catch((e) => {
        console.log("e :>> ", e);
        bot.sendMessage(chatId, e);
      });
  } catch (error) {
    console.log("error :>> ", error);
    bot.sendMessage(chatId, error);
  }
});

// Matches "/update"
bot.onText(/\/update/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "Incorrect command.\nCorrect: /update access_token");
});

// Matches "/update [whatever]"
bot.onText(/\/update (.+)/, (msg, match) => {
  // https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token={long-lived-access-token}

  const chatId = msg.chat.id;
  const access_token = match[1]; // the captured "whatever"

  try {
    bot.sendMessage(chatId, `Loading...`);
    curl
      .setHeaders([
        "user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36",
      ])
      .get(
        `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${access_token}`
      )
      .then(({ statusCode, body }) => {
        const { access_token, expires_in } = JSON.parse(body);
        var nexpires_in = new Date();
        nexpires_in.setSeconds(nexpires_in.getSeconds() + expires_in);

        bot.sendMessage(
          chatId,
          `statusCode ${statusCode}:\naccess_token: ${access_token}\nexpires_in: ${nexpires_in}`
        );
      })
      .catch((e) => {
        console.log("e :>> ", e);
        bot.sendMessage(chatId, e);
      });
  } catch (error) {
    console.log("error :>> ", error);
    bot.sendMessage(chatId, error);
  }
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
