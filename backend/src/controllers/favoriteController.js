import { readData, writeData } from "../config/fileStorage.js"

function getUserFavorites(data, userId) {
  if (!data.favorites) {
    data.favorites = []
  }

  let entry = data.favorites.find((f) => f.userId === Number(userId))

  if (!entry) {
    entry = { userId: Number(userId), objectIds: [] }
    data.favorites.push(entry)
  }

  return entry
}

export async function getFavorites(req, res) {
  const userId = Number(req.query.userId)

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "userId je obavezan.",
    })
  }

  const data = await readData()
  const entry = getUserFavorites(data, userId)

  const objects = data.objects.filter((o) => entry.objectIds.includes(o.id))

  res.json({
    success: true,
    data: {
      objectIds: entry.objectIds,
      objects,
    },
  })
}

export async function toggleFavorite(req, res) {
  const { userId, objectId } = req.body

  if (!userId || !objectId) {
    return res.status(400).json({
      success: false,
      message: "userId i objectId su obavezni.",
    })
  }

  const data = await readData()
  const entry = getUserFavorites(data, userId)
  const oid = Number(objectId)

  const index = entry.objectIds.indexOf(oid)

  if (index === -1) {
    entry.objectIds.push(oid)
  } else {
    entry.objectIds.splice(index, 1)
  }

  await writeData(data)

  res.json({
    success: true,
    data: {
      objectIds: entry.objectIds,
      isFavorite: index === -1,
    },
  })
}
