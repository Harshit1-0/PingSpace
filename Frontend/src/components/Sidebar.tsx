import { ReactNode, useEffect, useMemo, useState } from "react";
import ServerSidebar from "./ServerSidebar";
import { getToken } from "../store/authStore";
import { baseUrl } from "../helper/constant";
import { options } from "../helper/fetchOptions";
import InputModal from "./InputModal";

type Room = { name: string; id: string | number };
type Server = { name: string; id: string; owner_id: string };

type SidebarProps = {
  onSelectRoom: (roomName: string, id: any) => void;
  isOpen?: boolean;
  headerSlot?: ReactNode;
  activeRoomName?: string;
  server?: Server[];
  onServerChange?: (serverId: string) => void;
};

export default function Sidebar({
  onSelectRoom,
  isOpen,
  headerSlot,
  activeRoomName,
  server,
  onServerChange,
}: SidebarProps) {
  const [query, setQuery] = useState("");
  const [show, setShow] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [activeServerId, setActiveServerID] = useState<string | undefined>();
  const [rooms, setRooms] = useState<Room[]>([]);

  // Find the active server based on activeServerId
  const activeServer = useMemo(() => {
    if (!activeServerId || !server) return null;
    return server.find((s) => s.id === activeServerId);
  }, [activeServerId, server]);

  useEffect(() => {
    const getRoom = async () => {
      const response = await fetch(
        `${baseUrl}/chatroom/${activeServerId}`,
        options("GET")
      );
      const data = await response.json();
      activeServerId && setRooms(data);
    };
    getRoom();
  }, [activeServerId]);

  const handleSeverID = (serverID: string) => {
    serverID && setActiveServerID(serverID);
    if (typeof onServerChange === "function") onServerChange(serverID);
  };

  const filteredRooms = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return rooms;
    }
    return rooms.filter((r) => r.name.toLowerCase().includes(q));
  }, [rooms, query]);

  const tokenString = getToken() || "";

  const handleSubmit = async (values: Record<string, string | number>) => {
    if (!activeServerId) {
      console.error("No server selected");
      return;
    }
    const payload: any = {
      name: String(values.name || "").trim(),
      description: String(values.description || "").trim(),
      server_id: activeServerId,
    };
    try {
      const res = await fetch(
        `${baseUrl}/chat/create_room`,
        options("POST", tokenString, payload)
      );
      await res.json();
      setShow(false);
    } catch (error) {
      console.error(error);
    }
  };
  const onNewRoom = () => {
    show ? setShow(false) : setShow(true);
  };

  const handleInvite = () => {
    if (!activeServerId) return;
    
    // Create invite link (you can customize this based on your invite system)
    const inviteLink = `${window.location.origin}/join?server=${activeServerId}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(inviteLink).then(() => {
      setShowInviteModal(true);
      // Auto-hide after 2 seconds
      setTimeout(() => setShowInviteModal(false), 2000);
    }).catch((err) => {
      console.error("Failed to copy invite link:", err);
      // Fallback: show the link in an alert
      alert(`Invite Link: ${inviteLink}`);
    });
  };

  return (
    <aside className={"sidebar" + (isOpen ? " open" : "")}>
      <div className="sidebar-row">
        <ServerSidebar server={server} parent={handleSeverID} />
        <div className="sidebar-content">
          <div className="sidebar-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", position: "relative" }}>
            {activeServer ? (
              <>
                <div className="brand" style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {activeServer.name}
                </div>
                <div style={{ position: "relative" }}>
                  <button
                    onClick={handleInvite}
                    className="invite-button"
                    aria-label="Invite people"
                    title="Invite people to this server"
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--muted)",
                      cursor: "pointer",
                      padding: "6px 8px",
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "background-color 0.15s ease, color 0.15s ease",
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                      e.currentTarget.style.color = "var(--text)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "var(--muted)";
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <line x1="19" y1="8" x2="19" y2="14"></line>
                      <line x1="22" y1="11" x2="16" y2="11"></line>
                    </svg>
                  </button>
                  {showInviteModal && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        right: "0",
                        marginTop: "8px",
                        background: "var(--panel)",
                        color: "var(--text)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        padding: "8px 12px",
                        fontSize: "13px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        zIndex: 100,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Invite link copied!
                    </div>
                  )}
                </div>
              </>
            ) : (
              headerSlot ?? <div className="brand">PingSpace</div>
            )}
          </div>
          <div className="tabs">
            <button className="tab active">Text</button>
            <button className="tab">Voice</button>
          </div>
          <div style={{ padding: "8px 12px" }}>
            <input
              className="search"
              placeholder="Search groups & DMs"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="section">
            <div className="section-title">TEXT CHANNELS</div>
          </div>
          <div className="channel-list">
            {filteredRooms?.map((room) => (
              <div
                key={room.name}
                className={
                  "channel-item" +
                  (room.name === activeRoomName ? " active" : "")
                }
                onClick={() => onSelectRoom(room.name, room.id)}
                data-name={room.name}
                data-id={room.id}
              >
                <span className="channel-hash">#</span>
                <span className="channel-name">{room.name}</span>
              </div>
            ))}
            {onNewRoom && activeServerId && (
              <div className="channel-item" onClick={onNewRoom}>
                <span className="channel-hash">+</span>
                <span className="channel-name">Create channel</span>
              </div>
            )}
            {show && (
              <InputModal
                isOpen={show}
                title="Create Room"
                description="Set your room details. You can change these later."
                submitLabel="Create"
                onClose={() => setShow(false)}
                fields={[
                  {
                    name: "name",
                    label: "Room Name",
                    placeholder: "My Room",
                    required: true,
                    type: "text",
                  },
                  {
                    name: "description",
                    label: "Description",
                    placeholder: "Optional description",
                    type: "textarea",
                    rows: 3,
                  },
                ]}
                onSubmit={handleSubmit}
              />
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
