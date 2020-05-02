const firebaseAdminConfig = require("../config/firebase");
const geohash = require("ngeohash");
const jwt = require("jsonwebtoken");

const shopkeeperRef = firebaseAdminConfig.firestore().collection("shopkeeper");
const productRef = firebaseAdminConfig.firestore().collection("product");

class ProductController {
  async registerProduct(req, res) {
    const { displayName, email, quantity } = req.body;

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
          .set({ email, quantity, latitude, longitude, hash });
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

    const verifyProductExists = await productRef
      .where("displayName", "==", displayName)
      .get()
      .catch((err) => {
        console.log(err.message);
        return res.status(500).json({ err });
      });

    if (!verifyProductExists.empty) {
      verifyProductExists.forEach((doc) => {
        uidProduct = doc.id;
      });

      const range = getGeohashRange(
        parseFloat(latitude),
        parseFloat(longitude),
        10
      );

      const verifyLocation = await productRef
        .doc(uidProduct)
        .collection("Shops")
        .where("hash", ">=", range.lower)
        .where("hash", "<=", range.upper)
        .get()
        .catch((err) => {
          console.log(err.message);
          return res.status(500).json({ err });
        });

      var foundLocation = false;

      if (!verifyLocation.empty) {
        verifyLocation.forEach((doc) => {
          if (doc.data().quantity >= quantity) {
            foundLocation = true;
            return res.json("Produto disponível");
          }
        });

        if (!foundLocation)
          return res.json("Produto não disponível na quantidade desejada.");
      } else {
        return res.json("Produto não está disponível na região.");
      }
    } else {
      return res.json("Produto não foi encontrado na nossa base.");
    }
  }
}

function getGeohashRange(latitude, longitude, distance /* miles */) {
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

module.exports = new ProductController();
