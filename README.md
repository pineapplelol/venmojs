# venmo-api

A NodeJS wrapper for the Venmo API.

## Usage

### Login

Call `Venmo.login(username, password)` with username and password to sign in, generate an access key, and automatically set it.

### User Information

Call `Venmo.getUserIDfromUsername` to get the userID given a username. This userID is used when retrieving transactions or making payments.

Call `Venmo.getUserInformation` to get information about a user given a username. This information includes

```json
{
  id: The unique Venmo userID.
  username: The username of the user.
  name: The display name of the user.
  dateJoined: The date the user joined Venmo.
  profilePictureURL: The URL of the user's profile image.
}
```

### Transactions

Call `Venmo.getTransactions` with a userID to retrieve a list of transactions in the following format:

```json
{
  date: The date of the transaction.
  note: The message of the transaction.
  action: Typically `charge` or `pay`, for which the actor initiated to the target.
  actor: The actor user (the one who charged or paid) with the following properties: {
    name: The name of the actor user.
    username: The username of the actor user.
  }
  target: The target user (the one who was charged or paid) with the following properties: {
    name: The name of the target user.
    username: The username of the target user.
  }
}
```

### Errors

Errors will be thrown if there are invalid credentials (or not passed), or if you hit Venmo's rate limit.

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
