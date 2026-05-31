import { readData, writeData } from "../config/fileStorage.js"

export async function getWorkers(req, res) {
  const data = await readData()

  res.json({
    success: true,
    data: data.workers,
  })
}

export async function addWorker(req, res) {
  const { name, email } = req.body

  if (!name || !email) {
    return res.status(400).json({
      success: false,
      message: "Ime i email su obavezni.",
    })
  }

  const data = await readData()

  const workerExists = data.workers.find(
    (worker) => worker.email.toLowerCase() === email.toLowerCase()
  )

  const userExists = data.users.find(
    (user) => user.email.toLowerCase() === email.toLowerCase()
  )

  if (workerExists || userExists) {
    return res.status(400).json({
      success: false,
      message: "Korisnik ili radnik sa ovim emailom već postoji.",
    })
  }

  const newWorker = {
    id: Date.now(),
    name,
    email,
    role: "WORKER",
  }

  const newUser = {
    id: Date.now() + 1,
    name,
    email,
    password: "123456",
    role: "WORKER",
  }

  data.workers.push(newWorker)
  data.users.push(newUser)

  await writeData(data)

  res.status(201).json({
    success: true,
    message: "Radnik uspješno dodan.",
    data: newWorker,
  })
}

export async function updateWorker(req, res) {
  const id = Number(req.params.id)
  const { name, email } = req.body

  if (!name || !email) {
    return res.status(400).json({
      success: false,
      message: "Ime i email su obavezni.",
    })
  }

  const data = await readData()

  const workerIndex = data.workers.findIndex((worker) => worker.id === id)

  if (workerIndex === -1) {
    return res.status(404).json({
      success: false,
      message: "Radnik nije pronađen.",
    })
  }

  const oldEmail = data.workers[workerIndex].email

  data.workers[workerIndex] = {
    ...data.workers[workerIndex],
    name,
    email,
  }

  const userIndex = data.users.findIndex(
    (user) => user.email.toLowerCase() === oldEmail.toLowerCase()
  )

  if (userIndex !== -1) {
    data.users[userIndex] = {
      ...data.users[userIndex],
      name,
      email,
      role: "WORKER",
    }
  }

  await writeData(data)

  res.json({
    success: true,
    message: "Radnik uspješno izmijenjen.",
    data: data.workers[workerIndex],
  })
}

export async function deleteWorker(req, res) {
  const id = Number(req.params.id)

  const data = await readData()

  const worker = data.workers.find((worker) => worker.id === id)

  if (!worker) {
    return res.status(404).json({
      success: false,
      message: "Radnik nije pronađen.",
    })
  }

  data.workers = data.workers.filter((worker) => worker.id !== id)

  data.users = data.users.filter(
    (user) => user.email.toLowerCase() !== worker.email.toLowerCase()
  )

  await writeData(data)

  res.json({
    success: true,
    message: "Radnik uspješno obrisan.",
  })
}