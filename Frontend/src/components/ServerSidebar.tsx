import { useState } from "react";
import { options } from "../helper/fetchOptions";
import { getToken } from "../store/authStore";
import { baseUrl } from "../helper/constant";
import { jwtDecode } from "jwt-decode";
import InputModal from "./InputModal";
type Server = { name: string; id: string; owner_id: string };

type ServerProps = {
  server?: Server[];
  parent?: (serverId: string) => void;
};
type TokenPayload = { id: string; sub?: string };
const token = getToken();
const decoded = token ? jwtDecode<TokenPayload>(token) : null;
const id = decoded?.id;

const ServerSidebar = ({ server, parent }: ServerProps) => {
  const [activeId, setActiveId] = useState<string>("home");
  const [show, setShow] = useState(false);
  // parent(activeId );
  const createServer = () => {
    setShow(true);
  };

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
          onClick={() => {
            setActiveId(s.id);
            if (typeof parent === "function") parent(s.id);
          }}
        >
          <div className="server-avatar">
            {s.name?.slice(0, 2)?.toUpperCase()}
          </div>
          <span className="server-tooltip">{s.name}</span>
        </button>
      ))}
      <button className="server-item" onClick={createServer}>
        +
      </button>
      {show && (
        <InputModal
          isOpen={show}
          title="Create Server"
          description="Set your server details. You can change these later."
          submitLabel="Create"
          onClose={() => setShow(false)}
          fields={[
            {
              name: "name",
              label: "Server Name",
              placeholder: "My Server",
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
          onSubmit={async (values) => {
            const payload: any = {
              name: String(values.name || "").trim(),
              description: String(values.description || "").trim(),
              owner_id: id,
            };

            try {
              const res = await fetch(
                `${baseUrl}/chat/create_server`,
                options("POST", token, payload)
              );
              const ans = await res.json();

              const user_id = id;
              const server_id = ans.id;
              const role = "admin";
              const createServerUser = await fetch(
                `${baseUrl}/chat/serverUser/${user_id}/${server_id}/${role}`,
                options("POST", token)
              );
              const ans2 = await createServerUser.json();
              // const main = await ans2.json();
              console.log(ans2 );
              setShow(false);
            } catch (error) {
              console.error(error);
            }
          }}
        />
      )}
    </div>
  );
};

export default ServerSidebar;
