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
  const [roomID, setRoomID] = useState<string>();
  const [server, setServer] = useState([]);
  const [activeServerId, setActiveServerId] = useState<string>("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  let [room, setRoom] = useState("Select or Create the room");
  let username: string | undefined = undefined;
  let userId: string | undefined = undefined;
  const token = localStorage.getItem("token");
  // Backend token payload: {"sub": "<user_id>", "username": "<username>"}
  type TokenPayload = { sub: string; username?: string };
  console.log("this is how chat look like : ", chat);
  if (token) {
    const jwt_token = jwtDecode<TokenPayload>(token);
    username = jwt_token.username;
    userId = jwt_token.sub;
  }
  let ws = useRef<WebSocket | null>(null);
  console.log("This is the active room", room);
  useEffect(() => {
    if (!roomID || !token) return;
    const get_data = async () => {
      try {
        const res = await fetch(
          `${baseUrl}/messages/${roomID?.toString() || ""}`,
          options("GET", token)
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
    if (!roomID || !token) return;
    //receiving message from backend
    if (!username) return;
    console.log("useeffect is called", room);
    // Close any existing socket before opening a new one
    ws.current?.close();
    const wsUrl = baseUrl.replace(/^http/, "ws"); // ws:// or wss://
    console.log(
      "this is the serverid this ",
      activeServerId + "this the room ",
      room
    );
    console.log(wsUrl);
    // Backend route is: @router.websocket("/ws/{room_id}")
    // So final URL must be: ws://host/ws/<room_id>?token=<JWT>
    ws.current = new WebSocket(`${wsUrl}/ws/${roomID}?token=${token}`);

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
  }, [roomID]);

  // useEffect(() => {});
  const selectedRoom = (roomName: string, id: any) => {
    setRoomID(id);
    setRoom(roomName);
    setIsSidebarOpen(false);
  };
  const getServer = async () => {
    console.log(token);
    const url = `${baseUrl}/servers`;
    const option = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    };

    try {
      const res = await fetch(url, option);
      if (!res.ok) {
        throw new Error(`Error: ${res.status} - ${res.statusText}`);
      }
      const ans = await res.json();
      console.log("this is the server", ans);
      setServer(ans);
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  useEffect(() => {
    getServer();
  }, []);

  const send = () => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(message);
    }
    console.log("we send the message");
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
        getServer={getServer}
        // rooms={allRoom}
        onSelectRoom={selectedRoom}
        isOpen={isSidebarOpen}
        onToggleTheme={toggleTheme}
        headerSlot={<div className="brand">PingSpace</div>}
        activeRoomName={roomID}
        server={server}
        onServerChange={setActiveServerId}
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
          roomName={activeServerId ? room : "Select a server"}
        />
        {roomID ? (
          <>
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
          </>
        ) : (
          <div className="empty-chat-state">
            <div className="muted">Select a room to get started</div>
          </div>
        )}
      </main>
    </div>
  );
}
