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
  token_type: {
    value: "bearer",
    text: null,
  },
  expires_in: {
    value: null,
    text: null,
  },
};

for (const prop in instaConfig) {
  if (instaConfig[prop].text !== null) {
    console.log("obj." + prop + " = " + instaConfig[prop].text);
  }
}
