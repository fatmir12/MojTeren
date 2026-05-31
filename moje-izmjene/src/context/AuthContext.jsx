import { createContext, useContext, useState, useEffect } from "react"
import api from "../services/api"

const AuthContext = createContext()

export function AuthProvider({ children }) {

  const [currentUser, setCurrentUser] =
  useState(null)

  const [loading, setLoading] =
  useState(true)

  useEffect(() => {

    const savedUser =
    localStorage.getItem("currentUser")

    if(savedUser){

      setCurrentUser(
        JSON.parse(savedUser)
      )

    }

    setLoading(false)

  }, [])

  async function login(email,password){

    try{

      const response =
      await api.post(
        "/auth/login",
        {
          email,
          password,
        }
      )

      const user =
      response.data.data

      setCurrentUser(user)

      localStorage.setItem(
        "currentUser",
        JSON.stringify(user)
      )

      return{
        success:true,
        user,
      }

    }
    catch(error){

      return{

        success:false,

        message:
        error.response?.data?.message
        ||
        "Greška pri prijavi.",

      }

    }

  }

  async function register(
    name,
    email,
    password
  ){

    try{

      const response =
      await api.post(
        "/auth/register",
        {
          name,
          email,
          password,
        }
      )

      return{

        success:true,

        user:
        response.data.data,

      }

    }
    catch(error){

      return{

        success:false,

        message:
        error.response?.data?.message
        ||
        "Greška pri registraciji.",

      }

    }

  }

  function logout(){

    setCurrentUser(null)

    localStorage.removeItem(
      "currentUser"
    )

  }

  function updateCurrentUser(updates) {
    setCurrentUser((prev) => {
      if (!prev) return prev
      const next = { ...prev, ...updates }
      localStorage.setItem("currentUser", JSON.stringify(next))
      return next
    })
  }

  async function refreshUser() {
    if (!currentUser?.id) return

    try {
      const response = await api.get("/loyalty", {
        params: { userId: currentUser.id },
      })
      updateCurrentUser({
        loyaltyPoints: response.data.data.loyaltyPoints,
        remindersEnabled: response.data.data.remindersEnabled,
      })
    } catch {
      /* ignore */
    }
  }

  return(

    <AuthContext.Provider
    value={{

      currentUser,
      login,
      register,
      logout,
      updateCurrentUser,
      refreshUser,

    }}
    >

      {

        loading
        ?

        <div>

          Učitavanje...

        </div>

        :

        children

      }

    </AuthContext.Provider>

  )

}

export function useAuth(){

  return useContext(
    AuthContext
  )

}