import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";
import { options } from "../helper/fetchOptions.js";
import { jwtDecode } from "jwt-decode";

export default function ChatLayout() {
  const logout = useAuthStore((s) => s.logout);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const [socket, setSocket] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chat, setChat] = useState([]);
  const [message, setMessage] = useState("");
  const [allRoom, setAllRoom] = useState([]);
  let [room, setRoom] = useState("game");
  let username;
  const token = localStorage.getItem("token");
  if (token) {
    const jwt_token = jwtDecode(token);
    username = jwt_token.sub;
  }

  let ws = useRef<WebSocket | null>(null);
  useEffect(() => {
    const get_data = async () => {
      try {
        const res = await fetch(
          "http://127.0.0.1:8000/chat/histroy?room=1",
          options("get")
        );
        if (!res.ok) {
          const text = await res.text();
          console.error("Server returned error:", res.status, text);
          return;
        }

        let data = await res.json();
        setChat(data);
      } catch (error) {
        console.log(error);
      }
    };
    get_data();
  }, []);

  useEffect(() => {
    ws.current?.close();

    ws.current = new WebSocket(
      `ws://127.0.0.1:8000/chat/ws/${room}/${username}`
    );
    ws.current.onopen = () => console.log("WebSocket connected");
    ws.current.onmessage = (event) => {
      const new_obj = { sender: username, content: event.data };

      setChat((prev) => [...prev, new_obj]);
    };
    ws.current.onerror = (error) => console.error("WebSocket error:", error);
    ws.current.onclose = () => console.log("WebSocket closed");

    return () => {
      ws.current.close();
    };
  }, [room, username]);

  const selectedRoom = (e) => {
    const newRoom = e.currentTarget.dataset.name;
    setRoom(newRoom);
  };
  useEffect(() => {
    const getRoom = async () => {
      const url = "http://127.0.0.1:8000/chat/get_room";
      const options = {
        method: "GET",
        header: { "Content-Type": "application/json" },
      };
      const res = await fetch(url, options);
      const data = await res.json();
      setAllRoom(data);
    };
    getRoom();
  }, []);

  const send = () => {
    if (ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(message);
    }
    setMessage("");
  };
  const handleChat = (e) => {
    setMessage(e.target.value);
  };
  const handleNewRoom = async () => {
    const url = `http://127.0.0.1:8000/chat/create_room`;

    const data = {
      name: "study",
      description: "its for stduies",
    };
    const options = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    };
    const res = await fetch(url, options);
    const ans = await res.json();
  };

  return (
    <div className="app-shell">
      <aside className={"sidebar" + (isSidebarOpen ? " open" : "")}>
        <div className="sidebar-header">
          <div className="brand">PingSpace</div>
        </div>
        <div className="tabs">
          <button className="tab active">Groups</button>
          <button className="tab">DM</button>
        </div>
        <div className="channel-list">
          {allRoom.map((indi) => {
            return (
              <div
                className="channel-item"
                onClick={selectedRoom}
                data-name={indi.name}
              >
                {indi.name}
              </div>
            );
          })}

          <div className="channel-item">general</div>
          <div className="channel-item" onClick={handleNewRoom}>
            New room
          </div>
        </div>
      </aside>
      {isSidebarOpen && (
        <div className="overlay" onClick={() => setIsSidebarOpen(false)} />
      )}
      <main className="chat">
        <header className="chat-header">
          <button
            className="menu"
            aria-label="Open sidebar"
            onClick={() => setIsSidebarOpen(true)}
          >
            ☰
          </button>
          <input className="search" placeholder="Search" />
          <button className="circle" title="Toggle theme" onClick={toggleTheme}>
            🌓
          </button>
          <button className="circle" title="Profile" onClick={logout}>
            ⦿
          </button>
        </header>
        <section className="chat-body">
          {chat.map((indi) => {
            return (
              <div
                className={
                  username == indi.sender ? "message right" : "message left"
                }
              >
                {indi.sender}:{indi.content}
              </div>
            );
          })}
          {/* <div className="message left">Hello!</div>
          <div className="message right">Hi, welcome 👋</div> */}
        </section>
        <footer className="chat-input">
          <input
            placeholder="Type a message"
            onChange={handleChat}
            value={message}
          />
          <button className="send" onClick={send}>
            Send
          </button>
        </footer>
      </main>
    </div>
  );
}
