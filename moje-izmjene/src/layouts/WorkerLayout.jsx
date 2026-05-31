import Navbar from "../components/Navbar"
import Sidebar from "../components/Sidebar"
import "../styles/layout.css"

function WorkerLayout({ children }) {
  return (
    <>
      <Navbar />

      <div className="layout">
        <Sidebar type="worker" />

        <main className="layout-content">
          {children}
        </main>
      </div>
    </>
  )
}

export default WorkerLayout