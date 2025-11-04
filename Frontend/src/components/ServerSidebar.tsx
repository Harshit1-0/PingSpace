import { useState } from "react";
type Server = { name: string; id: string; owner_id: string };

type ServerProps = {
  server?: Server[];
};
// const dummyServers = [
//   {
//     id: "1",
//     name: "Developers Hub",
//     owner_id: "u101",
//   },
//   {
//     id: "2",
//     name: "Gamers Unite",
//     owner_id: "u102",
//   },
//   {
//     id: "3",
//     name: "Music Lovers",
//     owner_id: "u103",
//   },
//   {
//     id: "4",
//     name: "Study Corner",
//     owner_id: "u104",
//   },
//   {
//     id: "5",
//     name: "Design Community",
//     owner_id: "u105",
//   },
// ];

const ServerSidebar = ({ server }: ServerProps) => {
  console.log(server);

  const [activeId, setActiveId] = useState<string>("home");

  return (
    <div className="server-sidebar">
      <button
        className={"server-item home" + (activeId === "home" ? " active" : "")}
        aria-label="Home"
        onClick={() => setActiveId("home")}
      >
        <div className="server-avatar">PS</div>
      </button>
      <div className="server-separator" />
      {server?.map((s) => (
        <button
          key={s.id}
          className={"server-item" + (activeId === s.id ? " active" : "")}
          aria-label={s.name}
          data-tooltip={s.name}
          onClick={() => setActiveId(s.id)}
        >
          <div className="server-avatar">
            {s.name?.slice(0, 2)?.toUpperCase()}
          </div>
          <span className="server-tooltip">{s.name}</span>
        </button>
      ))}
    </div>
  );
};

export default ServerSidebar;
