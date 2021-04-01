const { default: axios } = require("axios");
const { Telegraf, Markup } = require("telegraf");
const queryString = require("query-string");

const token = process.env.BOT_TOKEN;
if (token === undefined) {
  throw new Error("BOT_TOKEN must be provided!");
}

const bot = new Telegraf(token);

// Start
bot.command("start", (ctx) =>
  ctx.reply(`Instruction:

1. https://developers.facebook.com/docs/instagram-basic-display-api/getting-started (step 1–3)
2. /auth client_id redirect_uri
3. /create client_id client_secret redirect_uri URL_FROM_PAGE

To update after expired:
/update access_token
`)
);

// Auth
bot.hears(/\/auth (.+)/, (ctx) => {
  const args = ctx.message.text.split(" ");
  const [, client_id, redirect_uri] = args;

  if (client_id && redirect_uri) {
    ctx.reply(
      "Auth in Instagram account and don't close the opeopened tab.\nAfter success login send this:\n/create client_id client_secret redirect_uri URL_FROM_PAGE",
      Markup.inlineKeyboard([
        Markup.button.url(
          "Login Instagram",
          `https://api.instagram.com/oauth/authorize?client_id=${client_id}&redirect_uri=${redirect_uri}&scope=user_profile,user_media&response_type=code`
        ),
      ])
    );
  } else {
    ctx.reply(`Incorrect command.\nCorrect: /auth client_id redirect_uri`);
  }
});
bot.hears(/\/auth$/, (ctx) => {
  ctx.reply(`Incorrect command.\nCorrect: /auth client_id redirect_uri`);
});

// Create
bot.hears(/\/create (.+)/, async (ctx) => {
  // https://api.instagram.com/oauth/access_token?&client_id={app-id}&client_secret={app-secret}&grant_type=authorization_code&redirect_uri={redirect-uri}&code={code}
  const args = ctx.message.text.split(" ");
  const [, client_id, client_secret, redirect_uri, callback_url] = args;

  if (client_id && client_secret && redirect_uri && callback_url) {
    const code =
      callback_url !== "URL_FROM_PAGE" &&
      callback_url.split("code=").length !== 0
        ? callback_url.split("code=")[1].split("#_")[0]
        : null;

    const { message_id } = await ctx.reply("Loading...");

    try {
      await axios
        .post(
          "https://api.instagram.com/oauth/access_token",
          queryString.stringify({
            client_id: client_id,
            client_secret: client_secret,
            grant_type: "authorization_code",
            redirect_uri: redirect_uri,
            code,
          })
        )
        .then(async (postRes) => {
          const { access_token: short_access_token } = postRes.data;

          await axios
            .get("https://graph.instagram.com/access_token", {
              params: {
                grant_type: "ig_exchange_token",
                client_secret,
                access_token: short_access_token,
              },
              headers: {
                "user-agent":
                  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36",
              },
            })
            .then((getRes) => {
              const { access_token, expires_in } = getRes.data;
              const nexpires_in = new Date();
              nexpires_in.setSeconds(nexpires_in.getSeconds() + expires_in);

              ctx.reply(
                `access_token: ${access_token}\nexpires_in: ${nexpires_in}`
              );
              ctx.deleteMessage(message_id);
            });
        });
    } catch (error) {
      console.log(error);
      const errorText =
        ("response" in error &&
          "data" in error.response &&
          ("error" in error.response.data
            ? error.response.data.error.message
            : "Something went wrong... Try again" ||
              "error_message" in error.response.data
            ? error.response.data.error_message
            : "Something went wrong... Try again")) ||
        "Something went wrong... Try again";

      ctx.deleteMessage(message_id);
      ctx.reply(errorText);
    }
  } else {
    ctx.reply(
      `Incorrect command.\nCorrect: /create client_id client_secret redirect_uri URL_FROM_PAGE`
    );
  }
});
bot.hears(/\/create$/, (ctx) => {
  ctx.reply(
    `Incorrect command.\nCorrect: /create client_id client_secret redirect_uri URL_FROM_PAGE`
  );
});

// Update
bot.hears(/\/update (.+)/, async (ctx) => {
  // https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token={long-lived-access-token}

  const args = ctx.message.text.split(" ");
  const [, old_access_token] = args;

  if (old_access_token) {
    const { message_id: update_message_id } = await ctx.reply("Loading...");

    try {
      await axios
        .get("https://graph.instagram.com/refresh_access_token", {
          params: {
            grant_type: "ig_refresh_token",
            access_token: old_access_token,
          },
          headers: {
            "user-agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36",
          },
        })
        .then((res) => {
          const { access_token, expires_in } = res.data;
          const nexpires_in = new Date();
          nexpires_in.setSeconds(nexpires_in.getSeconds() + expires_in);

          ctx.reply(
            `access_token: ${access_token}\nexpires_in: ${nexpires_in}`
          );
          ctx.deleteMessage(update_message_id);
        });
    } catch (error) {
      console.log(error);
      const errorText =
        ("response" in error &&
          "data" in error.response &&
          ("error" in error.response.data
            ? error.response.data.error.message
            : "Something went wrong... Try again" ||
              "error_message" in error.response.data
            ? error.response.data.error_message
            : "Something went wrong... Try again")) ||
        "Something went wrong... Try again";

      ctx.deleteMessage(update_message_id);
      ctx.reply(errorText);
    }
  } else {
    ctx.reply(`Incorrect command.\nCorrect: /update access_token`);
  }
});
bot.hears(/\/update$/, (ctx) => {
  ctx.reply(`Incorrect command.\nCorrect: /update access_token`);
});

bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
