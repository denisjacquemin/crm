// source https://github.com/tomanagle/google-oauth-tutorial
const querystring = require("querystring");
const axios = require("axios");

const getOAuthGoogleURL = function() {
    const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
    const options = {
        redirect_uri: process.env.HOST + process.env.OAUTH2_GOOGLE_CALLBACK_URL,
        client_id: process.env.OAUTH2_GOOGLE_CLIENT_ID,
        access_type: "offline",
        response_type: "code",
        prompt: "consent",
        scope: [
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile",
        ].join(" "),
    };

    return rootUrl + "?" + querystring.stringify(options);
}

const handleGoogleCallback = async function(code) {

    const { id_token, access_token } = await getTokens(code);

    const googleUser = await axios
        .get(
            `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`, {
                headers: {
                    Authorization: `Bearer ${id_token}`,
                },
            }
        )
        .then((res) => res.data)
        .catch((error) => {
            console.error(`Failed to fetch user`);
            throw new Error(error.message);
        });

    return googleUser;
}

const getTokens = function(code) {
    // Uses the code to get tokens
    // that can be used to fetch the user's profile

    const url = "https://oauth2.googleapis.com/token";
    const values = {
        code,
        client_id: process.env.OAUTH2_GOOGLE_CLIENT_ID,
        client_secret: process.env.OAUTH2_GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.HOST + process.env.OAUTH2_GOOGLE_CALLBACK_URL,
        grant_type: "authorization_code",
    };

    return axios
        .post(url, querystring.stringify(values), {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        })
        .then((res) => res.data)
        .catch((error) => {
            console.error(`Failed to fetch auth tokens`);
            throw new Error(error.message);
        });
}

module.exports = {
    getOAuthGoogleURL,
    handleGoogleCallback
};