const firebaseAdminConfig = require("../config/firebase");
const geohash = require("ngeohash");
const jwt = require("jsonwebtoken");

const shopkeeperRef = firebaseAdminConfig.firestore().collection("shopkeeper");
const productRef = firebaseAdminConfig.firestore().collection("product");

class ProductController {
  async registerProduct(req, res) {
    const { displayName, email, quantity, price } = req.body;

    const shopkeeperData = await shopkeeperRef
      .doc(email)
      .get()
      .catch((err) => {
        console.log(err.message);
        return res.status(500).json({ err });
      });

    const latitude = parseFloat(shopkeeperData.data().latitude);
    const longitude = parseFloat(shopkeeperData.data().longitude);
    const hash = geohash.encode(latitude, longitude);

    const verifyProductExists = await productRef
      .where("displayName", "==", displayName)
      .get()
      .catch((err) => {
        console.log(err.message);
        return res.status(500).json({ err });
      });

    var uidProduct;

    if (!verifyProductExists.empty) {
      verifyProductExists.forEach((doc) => {
        uidProduct = doc.id;
      });

      await productRef
        .doc(uidProduct)
        .collection("Shops")
        .doc(email)
        .set({
          email,
          quantity,
          latitude,
          longitude,
          hash,
          price,
        })
        .catch((err) => {
          console.log(err.message);
          return res.status(500).json({ err });
        });
    } else {
      uidProduct = jwt.sign({ displayName }, process.env.SECRET_KEY);
      try {
        const newDoc = productRef.doc(uidProduct);
        await newDoc.set({ displayName });
        await newDoc
          .collection("Shops")
          .doc(email)
          .set({ email, quantity, latitude, longitude, hash, price });
      } catch (err) {
        console.log(err.message);
        return res.status(500).json({ err });
      }
    }
    await shopkeeperRef
      .doc(email)
      .collection("Stock")
      .doc(uidProduct)
      .set({ displayName, quantity })
      .catch((err) => {
        console.log(err.message);
        return res.status(500).json({ err });
      });

    return res.json("Produto adicionado");
  }

  async verifyStock(req, res) {
    const { displayName, quantity, latitude, longitude } = req.body;
    var uidProduct;

    const verifyProductExists = await VerifyProductExists(displayName).catch(
      (err) => {
        console.log(err.message);
        return res.status(500).json({ err });
      }
    );

    if (!verifyProductExists.empty) {
      verifyProductExists.forEach((doc) => {
        uidProduct = doc.id;
      });

      const range = GetGeohashRange(
        parseFloat(latitude),
        parseFloat(longitude),
        10
      );

      const verifyLocation = await VerifyLocation(uidProduct, range).catch(
        (err) => {
          console.log(err.message);
          return res.status(500).json({ err });
        }
      );
      var foundLocation = false;

      if (!verifyLocation.empty) {
        verifyLocation.forEach((doc) => {
          if (doc.data().quantity >= quantity) {
            foundLocation = true;
          }
        });

        if (!foundLocation)
          return res.json("Produto não disponível na quantidade desejada.");
        else return res.json("Produto disponível");
      } else {
        return res.json("Produto não está disponível na região.");
      }
    } else {
      return res.json("Produto não foi encontrado na nossa base.");
    }
  }

  async bestShop(req, res) {
    const { shoplist, longitude, latitude } = req.body;
    let availabilityShop = new Object();
    let priceProduct = new Object();
    var uidProduct;
    const range = GetGeohashRange(
      parseFloat(latitude),
      parseFloat(longitude),
      10
    );
    for (const product of shoplist) {
      const verifyProductExists = await VerifyProductExists(
        product.displayName
      ).catch((err) => {
        console.log(err.message);
        return res.status(500).json({ err });
      });

      if (!verifyProductExists.empty) {
        verifyProductExists.forEach((doc) => {
          uidProduct = doc.id;
        });

        const verifyLocation = await VerifyLocation(uidProduct, range).catch(
          (err) => {
            console.log(err.message);
            return res.status(500).json({ err });
          }
        );

        if (!verifyLocation.empty) {
          verifyLocation.forEach((doc) => {
            if (doc.data().quantity >= product.quantity) {
              if (typeof availabilityShop[doc.data().email] == "undefined") {
                availabilityShop[doc.data().email] = [product.displayName];
                priceProduct[doc.data().email] = parseFloat(doc.data().price);
              } else {
                availabilityShop[doc.data().email].push(product.displayName);
                priceProduct[doc.data().email] += parseFloat(product.price);
              }
            }
          });
        }
        var minPrice = Number.MAX_SAFE_INTEGER,
          maxProducts = -1,
          sellerEmail = "";
        for (var [key, value] of Object.entries(availabilityShop)) {
          if (value.length > maxProducts) {
            maxProducts = value.length;
            sellerEmail = key;
            minPrice = priceProduct[key];
          } else if (
            value.length == maxProducts &&
            minPrice > priceProduct[key]
          ) {
            maxProducts = value.length;
            sellerEmail = key;
            minPrice = priceProduct[key];
          }
        }
        return res.json({
          minPrice,
          sellerEmail,
          maxProducts,
        });
      }
    }
  }
}
function GetGeohashRange(latitude, longitude, distance /* miles */) {
  const lat = 0.0144927536231884; // degrees latitude per mile
  const lon = 0.0181818181818182; // degrees longitude per mile

  const lowerLat = latitude - lat * distance;
  const lowerLon = longitude - lon * distance;

  const upperLat = latitude + lat * distance;
  const upperLon = longitude + lon * distance;

  const lower = geohash.encode(lowerLat, lowerLon);
  const upper = geohash.encode(upperLat, upperLon);

  return {
    lower,
    upper,
  };
}

async function VerifyProductExists(displayName) {
  const verifyProductExists = await productRef
    .where("displayName", "==", displayName)
    .get();

  return verifyProductExists;
}

async function VerifyLocation(uidProduct, range) {
  const verifyLocation = await productRef
    .doc(uidProduct)
    .collection("Shops")
    .where("hash", ">=", range.lower)
    .where("hash", "<=", range.upper)
    .get();

  return verifyLocation;
}

module.exports = new ProductController();
