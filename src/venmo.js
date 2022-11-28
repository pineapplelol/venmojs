import fetch from "node-fetch";
import readline from "readline";

const baseUrl = "https://api.venmo.com/v1";

// Generates a random device ID
const deviceId = "88884260-05O3-8U81-58I1-2WA76F357GR9"
  .replace(/[a-z]/gi, function (letter) {
    return String.fromCharCode(Math.floor(Math.random() * 26) + 65);
  })
  .replace(/[0-9]/gi, function (number) {
    return Math.floor(Math.random() * 10);
  });

// Headers that are sent with every request
const persistentHeaders = {
  "device-id": deviceId,
  "Content-Type": "application/json",
};

const Venmo = {
  /**
   * Gets the access token for the Venmo object.
   * @returns The current access token of the Venmo object.
   */
  getAccessToken: function () {
    return this.accessToken;
  },

  /**
   * Sets the access token for the Venmo object.
   * @param {string} accessToken The access token to be used for all API calls.
   */
  setAccessToken: function (accessToken) {
    this.accessToken = accessToken;
  },

  /**
   * Performs a login attempt given a username, password, and optionally 2FA authentication
   * credentials. This function does not set the access token for the Venmo object. It can return
   * two kinds of values:
   * 1. If 2FA is required, it will return {type: '2fa', value: otp_secret}.
   * 2. If login is successful, it will return {type: 'accessToken', value: accessToken}.
   *
   * @param {string} username The username for the Venmo account.
   * @param {string} password The password for the Venmo account.
   * @returns {Promise} A promise that resolves to a dictionary containing the value type and
   *   the value (either the 2FA secret or the access token).
   **/
  initLogin: async function (username, password, twofaHeaders = {}) {
    const resourcePath = baseUrl + "/oauth/access_token";
    const header_params = {
      Host: "api.venmo.com",
      ...persistentHeaders,
      ...twofaHeaders,
    };
    const body = { phone_email_or_username: username, client_id: "1", password: password };

    let type = "",
      value = "";
    return fetch(resourcePath, { method: "POST", headers: header_params, body: JSON.stringify(body) })
      .then((res) => {
        if (res.status == 401) {
          console.log("2fa required in initLogin");
          type = "2fa";
          value = res.headers.get("venmo-otp-secret");
        }
        return res.json();
      })
      .then((data) => {
        if (type !== "2fa") {
          console.log(data);
          type = "accessToken";
          value = data.access_token;
        }
      })
      .then(() => {
        return { type, value };
      });
  },

  /**
   * Will send a request to the Venmo API to complete the login process with 2FA.
   * @param {string} otpSecret The otp secret returned in the header of the initLogin request.
   */
  sendTwoFactor: function (otpSecret) {
    const resourcePath = baseUrl + "/account/two-factor/token";
    const header_params = {
      "venmo-otp-secret": otpSecret,
      ...persistentHeaders,
    };
    const body = { via: "sms" };
    return fetch(resourcePath, { method: "POST", headers: header_params, body: JSON.stringify(body) }).then(
      (res) => {}
    );
  },

  /**
   * Will complete an end-to-end login for a user given their username and password. If 2FA is required, it will
   * prompt the user for the 2FA code and then complete the login. It will automatically set the access token for
   * the Venmo object.
   * @param {string} username The username for the Venmo account.
   * @param {string} password The password for the Venmo account.
   * @returns The personal access token for the user.
   */
  login: async function (username, password) {
    const loginRes = await this.initLogin(username, password);
    let { type, value } = loginRes;

    if (type === "2fa") {
      console.log("2FA required. Please enter the code sent to your phone.");
      this.sendTwoFactor(value);
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      const code = await new Promise((res) => {
        rl.question("Enter OTP code:", (answer) => res(answer));
      });
      const loginRes = await this.initLogin(username, password, {
        "venmo-otp-secret": value,
        "venmo-otp": code,
      });
      value = loginRes.value;
    }

    this.setAccessToken(value);
    console.log("Logged in successfully! Your access token is: " + value);
    return value;
  },

  /**
   * Revoke an access token and log out the current session.
   * @param {string} accessToken The access token that should be logged out of (defaults to the current access token).
   */
  logout: function (accessToken = this.accessToken) {
    const resourcePath = baseUrl + "/oauth/access_token";
    fetch(resourcePath, { method: "DELETE", headers: { Authorization: "Bearer " + accessToken } });
    if (accessToken === this.accessToken) this.setAccessToken(null);
  },

  /**
   * Given a Venmo username, will return the unique Venmo userID for that username. This API call does
   * not require authentication (no access key required).
   * @param {string} username
   * @returns
   */
  getUserIDfromUsername: async function (username) {
    const resourcePath = baseUrl + "/users/" + username;

    return fetch(resourcePath, {
      method: "GET",
    })
      .then((res) => res.json())
      .then((userData) => userData.data.id);
  },

  /**
   * Given a Venmo username, will return information about the Venmo user. This API call does
   * not require authentication (no access key required).
   * @param {string} username
   * @returns Information about the user in object format. Has the following properties:
   *   - id: The unique Venmo userID.
   *   - username: The username of the user.
   *   - name: The display name of the user.
   *   - dateJoined: The date the user joined Venmo.
   *   - profilePictureURL: The URL of the user's profile image.
   */
  getUserInformation: async function (username) {
    const resourcePath = baseUrl + "/users/" + username;
    const params = { q: username };

    return fetch(resourcePath, {
      method: "GET",
    })
      .then((res) => res.json())
      .then((data) => ({
        id: data.data.id,
        username: data.data.username,
        name: data.data.display_name,
        dateJoined: data.data.date_joined,
        profilePictureURL: data.data.profile_picture_url,
      }));
  },

  /**
   * Will retrieve transactions directly from the Venmo API. This API call does
   * require authentication (access key required).
   * @param {string} userID The Venmo userID of the user to get transactions for.
   * @returns A list of all transactions that are returned directly from the API.
   */
  fetchTransactions: function (userID) {
    const resourcePath = baseUrl + "/stories/target-or-actor/" + userID;
    const params = { limit: 10 };

    return fetch(resourcePath, {
      method: "GET",
      headers: { Authorization: "Bearer " + this.accessToken },
      params: params,
    }).then((res) => {
      if (res.status === 429) return { error: { message: "Rate limit exceeded.", code: 429 } };
      return res.json();
    });
  },

  /**
   * Will return a clean version of the transaction data given a userID. This API call does
   * require authentication (access key required).
   * @param {string} userID The Venmo userID of the user to get transactions for.
   * @returns A list of all user transactions. Will return a list with objects with the following properties:
   *   - date: The date of the transaction.
   *   - note: The message of the transaction.
   *   - action: Typically `charge` or `pay`, for which the actor initiated to the target.
   *   - actor: The actor user (the one who charged or paid) with the following properties:
   *     - name: The name of the actor user.
   *     - username: The username of the actor user.
   *   - target: The target user (the one who was charged or paid) with the following properties:
   *     - name: The name of the target user.
   *     - username: The username of the target user.
   */
  getTransactions: async function (userID) {
    return this.fetchTransactions(userID).then((res) => {
      if (res.error) return { error: { message: res.error.message, code: res.error.code } };
      const transactions = res.data;
      return transactions
        .filter((transaction) => transaction.payment)
        .map((transaction) => {
          const { payment } = transaction;
          return {
            date: payment.date_completed,
            note: payment.note,
            action: payment.action,
            actor: { name: payment.actor.display_name, username: payment.actor.username },
            target: { name: payment.target.user.display_name, username: payment.target.user.username },
          };
        });
    });
  },
};

export default Venmo;
