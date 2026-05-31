import Navbar from "../components/Navbar"
import Sidebar from "../components/Sidebar"
import "../styles/layout.css"

function UserLayout({ children }) {
  return (
    <>
      <Navbar />

      <div className="layout">
        <Sidebar type="user" />

        <main className="layout-content">
          {children}
        </main>
      </div>
    </>
  )
}

export default UserLayout