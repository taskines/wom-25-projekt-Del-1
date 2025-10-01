const express = require('express')
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
require('dotenv').config()

const router = express.Router()
const prisma = new PrismaClient()


router.post('/login', async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { email: req.body.email }
    })

    if (user === null) {
        console.log('no user found')
        return res.status(401).send({msg: "Authentication failed"})
    }

    const match = await bcrypt.compare(req.body.password, user.password)

    if (!match) {
        console.log('bad password')
        return res.status(401).send({msg: "Authentication failed"})
    }
    
    const token = await jwt.sign({
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role
    }, process.env.JWT_SECRET, {expiresIn: '30d'})

    res.send({msg: "Login OK", jwt: token})
})

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

/*// POST /refresh - rotate refresh token
router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken) return res.status(400).json({ error: 'Missing refreshToken' });

  const now = Date.now();
  db.get('SELECT * FROM refresh_tokens WHERE token = ?', [refreshToken], (err, row) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!row) return res.status(401).json({ error: 'Invalid refresh token' });
    if (row.expires_at < now) {
      // remove expired token
      db.run('DELETE FROM refresh_tokens WHERE id = ?', [row.id]);
      return res.status(401).json({ error: 'Refresh token expired' });
    }

    // find user
    db.get('SELECT * FROM users WHERE id = ?', [row.user_id], (err, user) => {
      if (err || !user) return res.status(500).json({ error: 'User not found' });

      // delete old refresh token and issue a new one (rotate)
      db.run('DELETE FROM refresh_tokens WHERE id = ?', [row.id], (err) => {
        if (err) return res.status(500).json({ error: 'DB error' });
        createRefreshToken(db, user.id, (err, newRefreshToken) => {
          if (err) return res.status(500).json({ error: 'Failed to create refresh token' });
          const accessToken = issueAccessToken(user); // your helper
          return res.json({ accessToken, refreshToken: newRefreshToken });
        });
      });
    });
  });
});

// DELETE /refresh - revoke a refresh token
// Accepts JSON body { refreshToken } or Authorization: Bearer <token>
router.delete('/refresh', (req, res) => {
  const tokenFromBody = (req.body && req.body.refreshToken) || null;
  const tokenFromHeader = req.headers['authorization'] && req.headers['authorization'].replace(/^Bearer\s+/, '');
  const token = tokenFromBody || tokenFromHeader;
  if (!token) return res.status(400).json({ error: 'Missing token' });

  db.run('DELETE FROM refresh_tokens WHERE token = ?', [token], function(err) {
    if (err) return res.status(500).json({ error: 'DB error' });
    return res.json({ ok: true, deleted: this.changes });
  });
});
*/

module.exports = router