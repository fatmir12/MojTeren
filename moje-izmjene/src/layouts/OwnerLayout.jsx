import Navbar from "../components/Navbar"
import Sidebar from "../components/Sidebar"
import "../styles/layout.css"

function OwnerLayout({ children }) {
  return (
    <>
      <Navbar />

      <div className="layout">
        <Sidebar type="owner" />

        <main className="layout-content">
          {children}
        </main>
      </div>
    </>
  )
}

export default OwnerLayout