import { readData, writeData } from "../config/fileStorage.js"

export async function getLoyalty(req, res) {
  const userId = Number(req.query.userId)
  const userName = req.query.userName

  const data = await readData()

  const user = data.users.find(
    (u) =>
      (userId && u.id === userId) ||
      (userName && u.name === userName)
  )

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "Korisnik nije pronađen.",
    })
  }

  res.json({
    success: true,
    data: {
      userId: user.id,
      userName: user.name,
      loyaltyPoints: user.loyaltyPoints ?? 0,
      remindersEnabled: user.remindersEnabled !== false,
    },
  })
}

export async function updateReminders(req, res) {
  const { userId, remindersEnabled } = req.body

  const data = await readData()
  const user = data.users.find((u) => u.id === Number(userId))

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "Korisnik nije pronađen.",
    })
  }

  user.remindersEnabled = Boolean(remindersEnabled)
  await writeData(data)

  res.json({
    success: true,
    data: { remindersEnabled: user.remindersEnabled },
  })
}

export function addLoyaltyPoints(data, userName, points) {
  const user = data.users.find((u) => u.name === userName)

  if (user) {
    user.loyaltyPoints = (user.loyaltyPoints ?? 0) + points
  }
}

export function deductLoyaltyPoints(data, userName, points) {
  const user = data.users.find((u) => u.name === userName)

  if (user) {
    user.loyaltyPoints = Math.max(0, (user.loyaltyPoints ?? 0) - points)
  }
}
