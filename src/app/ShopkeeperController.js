const firebaseAdminConfig = require("../config/firebase");
const firebaseAuthConfig = require("../config/firebaseAuth");

const shopkeeperRef = firebaseAdminConfig.firestore().collection("shopkeeper");

class ShopkeeperController {
  async signup(req, res) {
    const {
      displayName,
      email,
      phoneNumber,
      documentNumber,
      password,
      location
    } = req.body;

    const verifyEmailExists = await shopkeeperRef
      .where("email", "==", email)
      .get()
      .catch((err) => {
        console.log(err.message);
        return res.status(500).json({ err });
      });

    if (!verifyEmailExists.empty) {
      return res.status(400).json({ error: "Email de registro já cadastrado" });
    }

    const verifyNumberExists = await shopkeeperRef
      .where("documentNumber", "==", documentNumber)
      .get()
      .catch((err) => {
        console.log(err.message);
        return res.status(500).json({ err });
      });

    if (!verifyNumberExists.empty) {
      return res
        .status(400)
        .json({ error: "Numero de registro já cadastrado" });
    }
    try {
      await shopkeeperRef.doc(email).set({
        displayName,
        email,
        phoneNumber,
        documentNumber,
        password,
        latitude,
        longitude,
      });
      await firebaseAuthConfig
        .auth()
        .createUserWithEmailAndPassword(email, password);
    } catch (error) {
      var errorCode = error.code;
      var errorMessage = error.message;
      console.log(errorMessage);
      return res.status({ errorCode }).json({ errorMessage });
    }

    return res.json({
      displayName,
      email,
      phoneNumber,
      location,
      documentNumber,
      password,
    });
  }
}

module.exports = new ShopkeeperController();
