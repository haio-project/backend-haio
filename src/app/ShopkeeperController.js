const axios = require("axios");

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
      location,
      latitude,
      longitude,
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
 
    /* API GR1D para validar CNPJ de varejo
    try {
      const {
        data: {
          cnae_principal: { codigo },
        },
      } = await axios.get(
        `https://gateway.gr1d.io/sandbox/serpro/consulta-cnpj/v1/cnpj/${documentNumber}`,
        {
          headers: {
            "X-Api-Key": process.env.GRID_KEY_CNPJ,
          },
        }
      );
      console.log(codigo);
      const initialCodigo = codigo.substring(1, 2);
      if (initialCodigo !== "47" || initialCodigo !== "46") {
        return res.status(404).json({
          error: "Seu CNPJ não é valido para varejo",
        });
      }
    } catch (err) {
      return res.status(500).json({ error: "GRID ERROR" });
    }

    */

    try {
      await shopkeeperRef.doc(email).set({
        displayName,
        email,
        phoneNumber,
        documentNumber,
        password,
        location,
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
      latitude,
      longitude,
    });
  }
}

module.exports = new ShopkeeperController();
