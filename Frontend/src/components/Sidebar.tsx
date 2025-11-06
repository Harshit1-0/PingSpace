import { ReactNode, useEffect, useMemo, useState } from "react";
import ServerSidebar from "./ServerSidebar";
import { getToken } from "../store/authStore";
import { baseUrl } from "../helper/constant";
import { options } from "../helper/fetchOptions";
import InputModal from "./InputModal";

type Room = { name: string; id: string | number };
type Server = { name: string; id: string; owner_id: string };
// removed unused Server type

type SidebarProps = {
  rooms: Room[];
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
  const [activeServerId, setActiveServerID] = useState("");

  console.log(
    "ye server ki id hai jo hum room mai mil rahi hai  : ",
    activeServerId
  );
  const handleSeverID = (serverID: string) => {
    setActiveServerID(serverID);
    if (typeof onServerChange === "function") onServerChange(serverID);
  };

  const filteredRooms = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rooms;
    return rooms.filter((r) => r.name.toLowerCase().includes(q));
  }, [rooms, query]);
  const tokenString = getToken() || "";

  const handleSubmit = async (values: Record<string, string | number>) => {
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
      const ans = await res.json();
      console.log(ans);
      setShow(false);
    } catch (error) {
      console.error(error);
    }
  };
  const onNewRoom = () => {
    show ? setShow(false) : setShow(true);
  };
  useEffect(() => {});
  return (
    <aside className={"sidebar" + (isOpen ? " open" : "")}>
      <div className="sidebar-row">
        <ServerSidebar server={server} parent={handleSeverID} />
        <div className="sidebar-content">
          <div className="sidebar-header">
            {headerSlot ?? <div className="brand">PingSpace</div>}
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
            {filteredRooms.map((room) => (
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
            {onNewRoom && (
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
