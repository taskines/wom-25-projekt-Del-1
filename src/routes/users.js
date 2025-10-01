const express = require('express')
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
require('dotenv').config()

const router = express.Router()
const prisma = new PrismaClient()


router.post('/login', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { email: req.body.email }
    });

    if (!user) {
      console.log('no user found');
      return res.status(401).json({ msg: "Authentication failed" });
    }

    const match = await bcrypt.compare(req.body.password, user.password);
    if (!match) {
      console.log('bad password');
      return res.status(401).json({ msg: "Authentication failed" });
    }

    // Access token (short expiry, esim. 15 min)
    const accessToken = jwt.sign({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }, process.env.JWT_SECRET, { expiresIn: '15m' });

    // Refresh token (pidempi, esim. 30 päivää)
    const refreshToken = jwt.sign(
      { sub: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Tallenna refresh token kantaan
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30*24*60*60*1000) // 30 päivää
      }
    });

    // Lähetä molemmat tokenit frontendille
    return res.json({
      accessToken,
      refreshToken
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ msg: "Internal server error" });
  }
});
router.post('/', async (req, res) => {

    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 12)

        const newUser = await prisma.user.create({
            data: {
                email: req.body.email,
                password: hashedPassword // hash av lösenordet
                
            }
        })  

        res.json({msg: "New user created", id: newUser.id})

    } catch (error) {
        console.log(error)
        res.status(500).send({msg: "Error: Create user failed"})
    }

})
router.delete('/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10)

    if (isNaN(userId)) {
      return res.status(400).json({ msg: "Invalid user ID" })
    }

    // Försök ta bort user
    const deletedUser = await prisma.user.delete({
      where: { id: userId }
    })

    res.json({ msg: "User deleted", id: deletedUser.id })

  } catch (error) {
    console.error(error)

    if (error.code === 'P2025') {
      // Prisma error: record not found
      return res.status(404).json({ msg: "User not found" })
    }

    res.status(500).json({ msg: "Error: Delete user failed" })
  }
})



module.exports = router