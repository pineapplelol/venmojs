import fetch from "node-fetch";
import utils from './utils.js'
import Constants from './constants.js'

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
   *   await Venmo.loginUsernamePassword("pineapplelol", "pineapplesaregreat")
   **/
  loginUsernamePassword: async function (username, password) {
    const device_id = utils.getRandomDeviceId();
    const resourcePath = Constants.BASE_URL + "/oauth/access_token";
    const header_params = {
      "device-id": device_id,
      "Content-Type": Constants.HEADER_PARAMS.CONTENT_TYPE,
      Host: "api.venmo.com",
    };
    const body = { phone_email_or_username: username, client_id: "1", password: password };
    const response = await fetch(resourcePath, {
      method: Constants.HTTP_METHODS.POST,
      headers: header_params,
      body: JSON.stringify(body)
    });
    const data = await response.json();
    if (data.error) {
      let err = {
        error: data.error
      }
      err.venmo_otp = response.headers.get('venmo-otp')
      err.venmo_otp_secret = response.headers.get('venmo-otp-secret')
      err.device_id = device_id
      return err
    }
    this.setAccessToken(data.access_token);
    return data;
  },

  /**
   * Logins given a deviceID, one-time password, and a secret token. 
   * This function will automatically set the access token
   * for the user.
   * @param {string} device_id The id of the device we are authenticating with.
   * @param {string} user_otp The token that was sent via sms.
   * @param {string} otp_secret The secret that is found in the response header of original login.
   * @returns {Promise} A promise that resolves to the user accessToken.
   * @example
   *   await Venmo.loginOneTimePassword(res.device_id, otp_secret, res.venmo_otp_secret);
   **/
  loginOneTimePassword: async function (device_id, user_otp, otp_secret) {
    const resourcePath = Constants.BASE_URL + "/oauth/access_token";
    const header_params = {
      "device-id": device_id,
      "Content-Type": Constants.HEADER_PARAMS.CONTENT_TYPE,
      'venmo-otp': user_otp,
      "venmo-otp-secret": otp_secret

    };
    const body = { client_id: "1" };
    const response = await fetch(resourcePath, {
      method: Constants.HTTP_METHODS.POST,
      headers: header_params,
      body: JSON.stringify(body)
    });
    const data = await response.json();
    if (data.error) {
      let err = err = {
        error: data.error
      }
      err.device_id = device_id
      return err
    }
    this.setAccessToken(data.access_token);
    return data;
  },

  /**
   * Sends a text message to a users mobile device with a one-time
   * password. This can be used for the one time password login.
   * @param {string} user_otp The token that was sent via sms.
   * @param {string} otp_secret The secret that is found in the response header of original login.
   * @returns JSON indicating the SMS was successfully sent
   **/
  sendTextForOneTimePassword: async function (device_id, otp_secret) {
    const resourcePath = Constants.BASE_URL + "/account/two-factor/token";
    const header_params = {
      "device-id": device_id,
      "Content-Type": Constants.HEADER_PARAMS.CONTENT_TYPE,
      "venmo-otp-secret": otp_secret
    };
    const body = { "via": "sms" };
    const response = await fetch(resourcePath, {
      method: Constants.HTTP_METHODS.POST,
      headers: header_params,
      body: JSON.stringify(body)
    });
    const data = await response.json();
    if (data.error) {
      let err = err = {
        error: data.error
      }
      return err
    }
    return data;
  },

  /**
   * Revoke an access token and log out the current session.
   * @param {string} accessToken The access token that should be logged out of (defaults to the current access token).
   */
  logout: function (accessToken = this.accessToken) {
    const resourcePath = Constants.BASE_URL + "/oauth/access_token";
    fetch(resourcePath, { method: "DELETE", headers: { Authorization: ["Bearer", accessToken].join(" ") } });
    if (accessToken === this.accessToken) this.setAccessToken(null);
  },

  /**
   * Given a Venmo username, will return the unique Venmo userID for that username. This API call does
   * not require authentication (no access key required).
   * @param {string} username
   * @returns
   */
  getUserIDfromUsername: async function (username) {
    const resourcePath = Constants.BASE_URL + "/users/" + username;

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
    const resourcePath = Constants.BASE_URL + "/users/" + username;
    const params = { q: username };

    return fetch(resourcePath, {
      method: Constants.HTTP_METHODS.GET,
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
   * Will retrieve transaction data directly from the Venmo API. This API call does
   * require authentication (access key required).
   * @param {string} transactionID The Venmo transactionID of the transaction.
   * @returns Information about a single transaction
   */
     fetchTransaction: function (transactionID) {
      const resourcePath = Constants.BASE_URL + "/stories/" + transactionID;
      return fetch(resourcePath, {
        method: "GET",
        headers: { Authorization: ["Bearer", this.accessToken].join(" ") }
      }).then((res) => {
        console.log(res)
        if (res.status === 429) return { error: { message: "Rate limit exceeded.", code: 429 } };
        return res.json();
      });
    },

  /**
   * Will retrieve transactions directly from the Venmo API. This API call does
   * require authentication (access key required).
   * @param {string} userID The Venmo userID of the user to get transactions for.
   * @returns A list of all transactions that are returned directly from the API.
   */
  fetchTransactions: function (userID) {
    const resourcePath = Constants.BASE_URL + "/stories/target-or-actor/" + userID;
    const params = { limit: 10 };
    return fetch(resourcePath, {
      method: "GET",
      headers: { Authorization: ["Bearer", this.accessToken].join(" ") },
      params: params,
    }).then((res) => {
      console.log(res)
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

  /**
   * Will retrieve a list of friends from the Venmo API. This API call does
   * require authentication (access key required).
   * @param {string} userID The Venmo userID of the user to get friends list for.
   * @returns A list of all friends for user.
   */
   getFriendsList: function (userID) {
    const resourcePath = Constants.BASE_URL + "/users/" + userID + "/friends";
    const params = { limit: 1000, offset: 1000 };
    return fetch(resourcePath, {
      method: "GET",
      headers: { Authorization: ["Bearer", this.accessToken].join(" ") },
      params: params,
    }).then((res) => {
      if (res.status === 429) return { error: { message: "Rate limit exceeded.", code: 429 } };
      return res.json();
    });
  },

  /**
   * Sends money to a specific account using the Venmo API. This API call does
   * require authentication (access key required).
   * @param {string} target_user The Venmo userID of the user to send money to.
   * @param {string} amount The amount of money to request from the user.
   * @param {string} note A note that describes the transaction.
   * @returns JSON indicating that the payment went through successfully
   */
  requestMoney: async function (target_user, amount, note, isPrivate = true) {
    if (this.getAccessToken() === null) {
      return {
        error: Constants.ERROR_CODES.ACCESS_TOKEN_NOT_SET
      }
    }
    let privacy_setting = isPrivate ? Constants.PRIVACY_SETTINGS.PRIVATE : 
      Constants.PRIVACY_SETTINGS.PUBLIC

    // assure the amount is negative.. this is the difference between a payment and request
    amount = Math.abs(amount)
    amount = -amount
    if (amount > 0) {
      return {
        error: {
          message: "Invalid Amount",
          code: 506
        }
      }
    }

    let limit = -1000
    if (amount < limit) {
      return {
        error: {
          message: "Invalid Amount: Limit reached",
          code: 507
        }
      }
    }

    const resourcePath = Constants.BASE_URL + "/payments";
    const header_params = {
      "Content-Type": Constants.HEADER_PARAMS.CONTENT_TYPE,
      "Authorization": ["Bearer", this.accessToken].join(" ")
    };
    const body = {
      "username": target_user,
      "audience": privacy_setting,
      "amount": amount,
      "note": note
    };
    const response = await fetch(resourcePath, {
      method: Constants.HTTP_METHODS.POST,
      headers: header_params,
      body: JSON.stringify(body)
    });
    const data = await response.json();
    if (data.error) {
      let err = err = {
        error: data.error
      }
      return err
    }
    return data
  }
};

export default Venmo;
