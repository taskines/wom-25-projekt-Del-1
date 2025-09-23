const express = require("express")
const { PrismaClient } = require("@prisma/client")
const authenticateToken = require("../middleware/authorize")

const router = express.Router()
const prisma = new PrismaClient()

// GET all boards owned by the logged-in user
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = parseInt(req.authUser.sub)
    if (isNaN(userId)) {
      return res.status(400).json({ msg: "Invalid user ID in token" })
    }

    const boards = await prisma.board.findMany({
      where: { ownerId: userId },
    })

    res.json(boards)
  } catch (err) {
    console.error("Error fetching boards:", err)
    res.status(500).json({ msg: "Error fetching boards", error: err.message })
  }
})

// POST create a new board
router.post("/", authenticateToken, async (req, res) => {
  try {
    const userId = parseInt(req.authUser.sub)
    if (isNaN(userId)) {
      return res.status(400).json({ msg: "Invalid user ID in token" })
    }

    const { name } = req.body
    if (!name) {
      return res.status(400).json({ msg: "Board name is required" })
    }

    const newBoard = await prisma.board.create({
      data: {
        name,
        ownerId: userId,
      },
    })

    res.status(201).json(newBoard)
  } catch (err) {
    console.error("Error creating board:", err)
    res.status(500).json({ msg: "Error creating board", error: err.message })
  }
})

// DELETE a board by ID
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const boardId = parseInt(req.params.id)
    if (isNaN(boardId)) {
      return res.status(400).json({ msg: "Invalid board ID" })
    }

    // Optional: only allow deletion if the logged-in user owns it
    const board = await prisma.board.findUnique({ where: { id: boardId } })
    if (!board) {
      return res.status(404).json({ msg: "Board not found" })
    }
    if (board.ownerId !== parseInt(req.authUser.sub)) {
      return res.status(403).json({ msg: "Not authorized to delete this board" })
    }

    await prisma.board.delete({ where: { id: boardId } })
    res.json({ msg: "Board deleted" })
  } catch (err) {
    console.error("Error deleting board:", err)
    res.status(500).json({ msg: "Error deleting board", error: err.message })
  }
})

module.exports = router
