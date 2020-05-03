const { Router } = require("express");

const ShopkeeperController = require("./app/ShopkeeperController");
const ProductController = require("./app/ProductController");

const routes = new Router();

routes.post("/shopkeeper/signup", ShopkeeperController.signup);
routes.post("/product/register", ProductController.registerProduct);
routes.post("/product/verifyStock", ProductController.verifyStock);
routes.post("/product/bestShop", ProductController.bestShop);

module.exports = routes;
