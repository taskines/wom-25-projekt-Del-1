const express = require('express')
const cors = require('cors')


require('dotenv').config()

const app = express()
app.use(cors()) // tillåt requests från alla origins

const PORT = process.env.PORT || 8080

console.log(`Node.js ${process.version}`)

app.use(express.json())

app.get('/', (req, res) => {
    res.json({ msg: "Lektionsexempel 0.3" })
})


const usersRouter = require('./routes/users')
app.use('/users', usersRouter)



app.listen(PORT, () => {
    try {
        console.log(`Running on http://localhost:${PORT}`)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
    
})