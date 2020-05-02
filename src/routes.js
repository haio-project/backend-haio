const { Router } = require("express");

const ShopkeeperController = require("./app/ShopkeeperController");

const routes = new Router();

routes.post("/shopkeeper/signup", ShopkeeperController.signup);

module.exports = routes;
