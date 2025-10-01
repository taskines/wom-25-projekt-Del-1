const express = require("express");
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const prisma = new PrismaClient();
const router = express.Router();

router.post("/", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(403).json({ msg: "Refresh token missing" });
  }

  try {
    // Tarkistaa onko token databasenissa
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken }
    });

    if (!storedToken) {
      return res.status(403).json({ msg: "Invalid refresh token" });
    }

    // Onko token vanhentunut tsekki
    if (storedToken.expiresAt < new Date()) {
      return res.status(403).json({ msg: "Refresh token expired" });
    }

    // Tarkista JWT allekirjoitus
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

    // Luo uusi access token
    const newAccessToken = jwt.sign(
      {
        sub: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );
    // Nyt palautetaan sama refresh token takaisin
    return res.json({
      accessToken: newAccessToken,
      refreshToken: refreshToken
    });

  } catch (err) {
    console.error("Refresh error:", err);
    return res.status(403).json({ msg: "Failed to refresh token" });
  }
});

module.exports = router;
