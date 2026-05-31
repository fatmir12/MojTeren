import { readData, writeData } from "../config/fileStorage.js"

export async function login(req, res) {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email i lozinka su obavezni.",
    })
  }

  const data = await readData()

  const user = data.users.find(
    (user) => user.email === email && user.password === password
  )

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Pogrešan email ili lozinka.",
    })
  }

<<<<<<< HEAD
  const safeUser = { ...user }
  delete safeUser.password
=======
  const { password: _, ...safeUser } = user
>>>>>>> 4ffb565aaf6b17a6fe10e4e498a6a39ffe35c473

  res.json({
    success: true,
    message: "Login uspješan.",
    data: {
      ...safeUser,
      loyaltyPoints: user.loyaltyPoints ?? 0,
      remindersEnabled: user.remindersEnabled !== false,
<<<<<<< HEAD
      specialProfile: user.specialProfile ?? null,
      specialProfileStatus: user.specialProfileStatus ?? null,
=======
>>>>>>> 4ffb565aaf6b17a6fe10e4e498a6a39ffe35c473
    },
  })
}

export async function register(req, res) {

  const {
    name,
    email,
    password,
  } = req.body

  if (
    !name ||
    !email ||
    !password
  ) {

    return res.status(400).json({

      success:false,

      message:
      "Sva polja su obavezna.",

    })

  }

  if(password.length < 6){

    return res.status(400).json({

      success:false,

      message:
      "Lozinka mora imati najmanje 6 karaktera.",

    })

  }

  const data =
  await readData()

  const userExists =
  data.users.find(

    user=>

    user.email
    .toLowerCase()

    ===

    email
    .toLowerCase()

  )

  if(userExists){

    return res.status(400).json({

      success:false,

      message:
      "Email adresa je već zauzeta.",

    })

  }

  const newUser={

    id:Date.now(),

    name,

    email,

    password,

    role:"USER",

    loyaltyPoints: 0,

    remindersEnabled: true,

  }

  data.users.push(
    newUser
  )

  await writeData(data)

<<<<<<< HEAD
  const safeUser = { ...newUser }
  delete safeUser.password
=======
  const { password: _pw, ...safeUser } = newUser
>>>>>>> 4ffb565aaf6b17a6fe10e4e498a6a39ffe35c473

  res.status(201).json({

    success:true,

    message:
    "Registracija uspješna.",

    data: safeUser,

  })

}