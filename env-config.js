require("dotenv").config({ path: "env.production" });

module.exports = {
  firebaseConfiguration: {
    apiKey: process.env["FIREBASE_API_KEY"],
    authDomain: process.env["AUTH_DOMAIN"],
    databaseURL: process.env["DATABASE_URL"],
    projectId: process.env["PROJECT_ID"],
    storageBucket: process.env["STORAGE_BUCKET"],
    messagingSenderId: process.env["MESSAGING_SENDER_ID"],
  },
};
