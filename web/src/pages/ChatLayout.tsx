import { useState } from 'react'
import { useAuthStore } from '../store/authStore'

export default function ChatLayout() {
  const logout = useAuthStore((s) => s.logout)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  return (
    <div className="app-shell">
      <aside className={"sidebar" + (isSidebarOpen ? " open" : "") }>
        <div className="sidebar-header">
          <div className="brand">Biscord</div>
        </div>
        <div className="tabs">
          <button className="tab active">Groups</button>
          <button className="tab">DM</button>
        </div>
        <div className="channel-list">
          <div className="channel-item active">kaushik</div>
          <div className="channel-item">general</div>
          <div className="channel-item">random</div>
        </div>
      </aside>
      {isSidebarOpen && <div className="overlay" onClick={() => setIsSidebarOpen(false)} />}
      <main className="chat">
        <header className="chat-header">
          <button className="menu" aria-label="Open sidebar" onClick={() => setIsSidebarOpen(true)}>☰</button>
          <input className="search" placeholder="Search" />
          <button className="circle" title="Profile" onClick={logout}>
            ⦿
          </button>
        </header>
        <section className="chat-body">
          <div className="message left">Hello!</div>
          <div className="message right">Hi, welcome 👋</div>
        </section>
        <footer className="chat-input">
          <input placeholder="Type a message" />
          <button className="send">Send</button>
        </footer>
      </main>
    </div>
  )
}


