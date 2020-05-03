const admin = require("firebase-admin");

const firebaseAdminConfig = admin.initializeApp({
  credential: admin.credential.cert(process.env.FIREBASE_CONFIG),
  databaseURL: "https://haio-f6f4b.firebaseio.com",
});

module.exports = firebaseAdminConfig;
