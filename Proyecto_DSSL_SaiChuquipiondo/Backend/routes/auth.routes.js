const express = require("express");
const router = express.Router();
const { login } = require("../controllers/auth.controller");
const { validateLogin } = require("../middleware/validators");

router.post("/login", validateLogin, login);

module.exports = router;
