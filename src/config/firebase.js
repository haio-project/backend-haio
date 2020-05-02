const admin = require("firebase-admin");
const firebaseFile = require("./firebase.json");

const firebaseAdminConfig = admin.initializeApp({
  credential: admin.credential.cert(firebaseFile),
  databaseURL: "https://haio-f6f4b.firebaseio.com",
});

module.exports = firebaseAdminConfig;
