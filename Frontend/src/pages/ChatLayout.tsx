import { useEffect, useState, useRef, type KeyboardEvent } from "react";
import { useAuthStore } from "../store/authStore.js";
import { useThemeStore } from "../store/themeStore.js";
import { jwtDecode } from "jwt-decode";
import Sidebar from "../components/Sidebar.js";
import ChatHeader from "../components/ChatHeader.js";
import ChatScreen from "../components/ChatScreen.js";
import { baseUrl } from "../helper/constant.js";
import { options } from "../helper/fetchOptions.js";

export default function ChatLayout() {
  const logout = useAuthStore((s) => s.logout);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  // socket state not used; using ws ref instead
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chat, setChat] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [allRoom, setAllRoom] = useState([]);
  const [roomID, setRoomID] = useState(1);
  const [server, setServer] = useState([]);
  let [room, setRoom] = useState("game");
  let username: string | undefined = undefined;
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
          `${baseUrl}/chat/histroy?room=${roomID.toString()}`,
          options("GET")
        );
        if (!res.ok) {
          const text = await res.text();
          console.error("Server returned error:", res.status, text);
          return;
        }

        let data = await res.json();
        console.log(data);
        setChat(data);
      } catch (error) {
        console.log(error);
      }
    };
    get_data();
  }, [roomID]);

  useEffect(() => {
    if (!username) return;

    ws.current?.close();
    const wsUrl = baseUrl.replace(/^http/, "ws"); // ws:// or wss://
    ws.current = new WebSocket(`${wsUrl}/chat/ws/${room}/${username}`);

    ws.current.onopen = () => console.log("WebSocket connected");
    ws.current.onmessage = (event) => {
      const new_obj = { sender: username, content: event.data };
      setChat((prev: any[]) => [...prev, new_obj]);
    };
    ws.current.onerror = (error) => console.error("WebSocket error:", error);
    ws.current.onclose = () => console.log("WebSocket closed");

    return () => ws.current?.close();
  }, [room, username]);

  const selectedRoom = (roomName: string, id: any) => {
    console.log("yoooooo", roomName, id);
    setRoomID(id);
    setRoom(roomName);
    setIsSidebarOpen(false);
  };

  //////////////////get server////////////////

  useEffect(() => {
    const getServer = async () => {
      const url = `${baseUrl}/chat/get_server`;
      const res = await fetch(url);
      const ans = await res.json();
      setServer(ans);
    };
    getServer();
  }, []);

  ////////////////////get room////////////////////////

  useEffect(() => {
    const getRoom = async () => {
      const url = `${baseUrl}/chat/get_room`;
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
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(message);
    }
    setMessage("");
  };
  const handleChat = (e: any) => {
    setMessage(e.target.value);
  };
  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (message.trim()) send();
    }
  };
  const handleNewRoom = async () => {
    const url = `${baseUrl}/chat/create_room`;

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
    await res.json();
  };

  return (
    <div className="app-shell">
      <Sidebar
        rooms={allRoom}
        onSelectRoom={selectedRoom}
        onNewRoom={handleNewRoom}
        isOpen={isSidebarOpen}
        headerSlot={<div className="brand">PingSpace</div>}
        activeRoomName={room}
        server={server}
      />
      {isSidebarOpen && (
        <div className="overlay" onClick={() => setIsSidebarOpen(false)} />
      )}
      <main className="chat">
        <ChatHeader
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onToggleTheme={toggleTheme}
          onLogout={logout}
          userName={username as string}
          roomName={room}
        />
        <ChatScreen username={username} messages={chat as any} />
        <footer className="chat-input">
          <input
            placeholder="Type a message"
            onChange={handleChat}
            value={message}
            onKeyDown={handleInputKeyDown}
          />
          <button className="send" onClick={send}>
            Send
          </button>
        </footer>
      </main>
    </div>
  );
}
