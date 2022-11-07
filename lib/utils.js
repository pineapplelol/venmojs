import readline from "readline";

function getRandomDeviceId() {
    const deviceId = "88884260-05O3-8U81-58I1-2WA76F300008"
        .replace(/[a-z]/gi, function (letter) {
            return String.fromCharCode(Math.floor(Math.random() * 26) + 65);
        })
        .replace(/[0-9]/gi, function (number) {
            return Math.floor(Math.random() * 10);
        });
    return deviceId;
}

function fetchOneTimePasswordTokenSMS() {
    let query = "Please enter your Venmo authentication token (SMS):"
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
  
    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans.trim());
    }))
  }

export default {
    getRandomDeviceId,
    fetchOneTimePasswordTokenSMS
}