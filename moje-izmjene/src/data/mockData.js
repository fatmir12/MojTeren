export const users = [
  {
    id:1,
    name:"Fatmir",
    email:"Fatmir@test.com",
    password:"123456",
    role:"OWNER",
  },
  {
    id:2,
    name:"Deni",
    email:"Deni@test.com",
    password:"123456",
    role:"WORKER",
  },
  {
    id:3,
    name:"Matko",
    email:"Matko@test.com",
    password:"123456",
    role:"USER",
  },

  {
    id:4,
    name:"Haris",
    email:"Haris@test.com",
    password:"123456",
    role:"WORKER",
  },
]

export const objects = [
  {
    id:1,
    name:"Arena Travnik",
    city:"Travnik",
    sport:"Fudbal",
  },
  {
    id:2,
    name:"Sport Centar Zenica",
    city:"Zenica",
    sport:"Košarka",
  },
  {
    id:3,
    name:"Basket Arena",
    city:"Sarajevo",
    sport:"Basket",
  },
  
]

export const terms = [
  {
    id: 1,
    objectName: "Arena Travnik",
    date: "2026-05-24",
    time: "18:00",
    price: 40,
    status: "FREE",
  },
  {
    id: 2,
    objectName: "Sport Centar Zenica",
    date: "2026-05-24",
    time: "20:00",
    price: 50,
    status: "RESERVED",
  },
  {
    id: 3,
    objectName: "Basket Arena",
    date: "2026-05-25",
    time: "19:00",
    price: 35,
    status: "LOCKED",
  },
  {
  id: 4,
  objectName: "Arena Travnik",
  date: "2026-05-26",
  time: "21:00",
  price: 45,
  status: "FREE",
},
]

export const reservations = [
  {
    id: 1,
    userName: "Matko",
    objectName: "Arena Travnik",
    date: "2026-05-24",
    time: "18:00",
    status: "CONFIRMED",
  },
  {
    id: 2,
    userName: "Matko",
    objectName: "Sport Centar Zenica",
    date: "2026-05-24",
    time: "20:00",
    status: "WAITING_PAYMENT",
  },
  {
    id: 3,
    userName: "Matko",
    objectName: "Basket Arena",
    date: "2026-05-25",
    time: "19:00",
    status: "CANCELLED",
  },
]

export const workers = [

  {
    id:1,
    name:"Deni",
    email:"Deni@test.com",
    role:"WORKER",
  },

  {
    id:2,
    name:"Haris",
    email:"Haris@test.com",
    role:"WORKER",
  },

]