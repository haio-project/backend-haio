require("dotenv").config({ path: require("find-config")(".env") });
const app = require("./app");

app.listen(process.env.PORT);
