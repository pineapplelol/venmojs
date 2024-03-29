# venmo-api

A NodeJS wrapper for the Venmo API.

## Usage

### Login / Logout

Call `Venmo.login(username, password)` with username and password to sign in, generate an access key, and automatically set it. May require a 2FA code to be input. It will also return the personal access token. To logout, call `Venmo.logout()`. Optionally provide the access token to logout of a specific account with `Venmo.logout(accessToken)`.

### User Information

Call `Venmo.getUserIDfromUsername` to get the userID given a username. This userID is used when retrieving transactions or making payments.

Call `Venmo.getUserInformation` to get information about a user given a username. This information includes

- id: The unique Venmo userID.
- username: The username of the user.
- name: The display name of the user.
- dateJoined: The date the user joined Venmo.
- profilePictureURL: The URL of the user's profile image.

Example:

```json
{
  "id": "0123456789",
  "username": "pineapplelol",
  "name": "Pineapple Lol",
  "dateJoined": "2016",
  "profilePictureURL": "https://pineapple.lol/asset/fronz.png"
}
```

### Transactions

Call `Venmo.getTransactions` with a userID to retrieve a list of transactions in the following format:

- date: The date of the transaction.
- note: The message of the transaction.
- action: Typically `charge` or `pay`, for which the actor initiated to the target.
- actor: The actor user (the one who charged or paid) with the following properties:
  - name: The name of the actor user.
  - username: The username of the actor user.
- target: The target user (the one who was charged or paid) with the following properties:
  - name: The name of the target user.
  - username: The username of the target user.

```json
{
  "date": "2018-04-29 4:23PM",
  "note": "Here are your fruit",
  "action": "pay",
  "actor": {
    "name": "Pineapple Lol",
    "username": "pineapplelol"
  },
  "target": {
    "name": "Apple Lol",
    "username": "applelol"
  }
}
```

### Errors

Errors will be thrown if there are invalid credentials (or not passed), or if you hit Venmo's rate limit (quite low).

### Example

```js
import Venmo from "venmo-api";

await Venmo.login("pineapplelol", "pineapplesaregreat");

Venmo.getUserIDfromUsername("username")
  .then((id) => {
    return Venmo.getTransactions(id);
  })
  .then((transactions) => {
    console.log(transactions);
  })
  .then(() => {
    Venmo.logout();
  });
```

### Practically

You can build a easy server with this package to serve a frontend such as [venmo.lol](https://github.com/pineapplelol/venmo.lol). Note that Venmo's rate limit is quite low, so you should aim to cache results of API calls to prevent duplicate calls.
