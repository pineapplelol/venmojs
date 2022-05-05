import fetch from "node-fetch";

const baseUrl = "https://api.venmo.com/v1";

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
   * Logins given a username and password. Currently does not support
   * 2FA (coming soon). This function will automatically set the access token
   * for the user.
   * @param {string} username The username for the Venmo account.
   * @param {string} password The password for the Venmo account.
   * @returns {Promise} A promise that resolves to the user accessToken.
   * @example
   *   await Venmo.login("pineapplelol", "pineapplesaregreat")
   **/
  login: function (username, password) {
    const deviceId = "88884260-05O3-8U81-58I1-2WA76F357GR9"
      .replace(/[a-z]/gi, function (letter) {
        return String.fromCharCode(Math.floor(Math.random() * 26) + 65);
      })
      .replace(/[0-9]/gi, function (number) {
        return Math.floor(Math.random() * 10);
      });

    const resourcePath = baseUrl + "/oauth/access_token";
    const header_params = {
      "device-id": deviceId,
      "Content-Type": "application/json",
      Host: "api.venmo.com",
    };
    const body = { phone_email_or_username: username, client_id: "1", password: password };

    return fetch(resourcePath, { method: "POST", headers: header_params, body: JSON.stringify(body) })
      .then((res) => res.json())
      .then((json) => {
        this.setAccessToken(json.access_token);
        return json.access_token;
      });
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
