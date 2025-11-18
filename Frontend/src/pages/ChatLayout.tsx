import { jwtDecode } from "jwt-decode";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";
import ChatHeader from "../components/ChatHeader.js";
import ChatScreen from "../components/ChatScreen.js";
import Sidebar from "../components/Sidebar.js";
import { baseUrl } from "../helper/constant.js";
import { options } from "../helper/fetchOptions.js";
import { useAuthStore } from "../store/authStore.js";
import { useThemeStore } from "../store/themeStore.js";

export default function ChatLayout() {
  const logout = useAuthStore((s) => s.logout);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const theme = useThemeStore((s) => s.theme);
  // socket state not used; using ws ref instead
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chat, setChat] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  // const [allRoom, setAllRoom] = useState([]);
  const [roomID, setRoomID] = useState(1);
  const [server, setServer] = useState([]);
  const [activeServerId, setActiveServerId] = useState<string>("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  let [room, setRoom] = useState("game");
  let username: string | undefined = undefined;
  let userId: string | undefined = undefined;
  const token = localStorage.getItem("token");
  type TokenPayload = { id: string; sub?: string };
  if (token) {
    const jwt_token = jwtDecode<TokenPayload>(token);
    username = jwt_token.sub;
    userId = jwt_token.id;
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
      try {
        const payload = JSON.parse(event.data);
        const new_obj = { sender: payload.sender, content: payload.content };
        setChat((prev: any[]) => [...prev, new_obj]);
      } catch (e) {
        // Fallback if server sends plain text
        const new_obj = { sender: "", content: String(event.data) };
        setChat((prev: any[]) => [...prev, new_obj]);
      }
    };
    ws.current.onerror = (error) => console.error("WebSocket error:", error);
    ws.current.onclose = () => console.log("WebSocket closed");

    return () => ws.current?.close();
  }, [room, username]);

  // useEffect(() => {});
  const selectedRoom = (roomName: string, id: any) => {
    setRoomID(id);
    setRoom(roomName);
    setIsSidebarOpen(false);
  };

  //////////////////get server////////////////
  useEffect(() => {
    const getServer = async () => {
      const url = `${baseUrl}/chat/get_server?id=${userId}`;
      const res = await fetch(url);
      const ans = await res.json();
      setServer(ans);
    };
    getServer();
  }, []);

  ////////////////////get room////////////////////////
  // useEffect(() => {
  //   const getRoom = async () => {
  //     const url = `${baseUrl}/chat/get_room/${server_id}`;
  //     const options = {
  //       method: "GET",
  //       header: { "Content-Type": "application/json" },
  //     };
  //     const res = await fetch(url, options);
  //     const data = await res.json();
  //     setAllRoom(data);
  //   };
  //   getRoom();
  // }, []);

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
  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setMessage((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showEmojiPicker]);
  return (
    <div className="app-shell">
      <Sidebar
        // rooms={allRoom}
        onSelectRoom={selectedRoom}
        isOpen={isSidebarOpen}
        headerSlot={<div className="brand">PingSpace</div>}
        activeRoomName={room}
        server={server}
        onServerChange={setActiveServerId}
      />
      {isSidebarOpen && (
        <div className="overlay" onClick={() => setIsSidebarOpen(false)} />
      )}
      {activeServerId ? (
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
            <div className="chat-input-wrapper" ref={emojiPickerRef}>
              <button
                className="emoji-button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                type="button"
                aria-label="Toggle emoji picker"
              >
                😊
              </button>
              {showEmojiPicker && (
                <div className="emoji-picker-container">
                  <EmojiPicker
                    onEmojiClick={handleEmojiClick}
                    theme={theme === "dark" ? Theme.DARK : Theme.LIGHT}
                  />
                </div>
              )}
              <input
                placeholder="Type a message"
                onChange={handleChat}
                value={message}
                onKeyDown={handleInputKeyDown}
              />
            </div>
            <button className="send" onClick={send}>
              Send
            </button>
          </footer>
        </main>
      ) : (
        <main
          className="chat"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div className="muted">Select a server to get started</div>
        </main>
      )}
    </div>
  );
}
