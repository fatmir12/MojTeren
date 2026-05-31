import { readData, writeData } from "../config/fileStorage.js"

export async function getObjects(req, res) {
  const data = await readData()

  res.json({
    success: true,
    data: data.objects,
  })
}

export async function addObject(req, res) {
  const { name, city, sport, lat, lng, address } = req.body

  if (!name || !city || !sport) {
    return res.status(400).json({
      success: false,
      message: "Naziv, grad i sport su obavezni.",
    })
  }

  if (lat == null || lng == null) {
    return res.status(400).json({
      success: false,
      message: "Lokacija na mapi je obavezna (pin).",
    })
  }

  const data = await readData()

  const newObject = {
    id: Date.now(),
    name,
    city,
    sport,
    lat: Number(lat),
    lng: Number(lng),
    address: address || "",
  }

  data.objects.push(newObject)

  await writeData(data)

  res.status(201).json({
    success: true,
    message: "Objekat dodan.",
    data: newObject,
  })
}

export async function updateObject(req, res) {
  const id = Number(req.params.id)
  const { name, city, sport, lat, lng, address } = req.body

  if (!name || !city || !sport) {
    return res.status(400).json({
      success: false,
      message: "Naziv, grad i sport su obavezni.",
    })
  }

  const data = await readData()

  const objectIndex = data.objects.findIndex((object) => object.id === id)

  if (objectIndex === -1) {
    return res.status(404).json({
      success: false,
      message: "Objekat nije pronađen.",
    })
  }

  data.objects[objectIndex] = {
    ...data.objects[objectIndex],
    name,
    city,
    sport,
    ...(lat != null ? { lat: Number(lat) } : {}),
    ...(lng != null ? { lng: Number(lng) } : {}),
    ...(address !== undefined ? { address: address || "" } : {}),
  }

  await writeData(data)

  res.json({
    success: true,
    message: "Objekat uspješno izmijenjen.",
    data: data.objects[objectIndex],
  })
}

export async function deleteObject(req, res) {
  const id = Number(req.params.id)

  const data = await readData()

  const objectExists = data.objects.some((object) => object.id === id)

  if (!objectExists) {
    return res.status(404).json({
      success: false,
      message: "Objekat nije pronađen.",
    })
  }

  data.objects = data.objects.filter((object) => object.id !== id)

  await writeData(data)

  res.json({
    success: true,
    message: "Objekat obrisan.",
  })
}