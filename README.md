# venmo-api

A NodeJS wrapper for the Venmo API.

## Installation

## Usage

```js
import Venmo from "venmo-api";

await Venmo.login("pineapplelol", "pineapplesaregreat");

Venmo.getUserIDfromUsername("timmyko")
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
