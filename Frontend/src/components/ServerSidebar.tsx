import { useState, useEffect, useRef } from "react";
import { options } from "../helper/fetchOptions";
import { getToken, useAuthStore } from "../store/authStore";
import { baseUrl } from "../helper/constant";
import { jwtDecode } from "jwt-decode";
import InputModal from "./InputModal";
type Server = {
  name: string;
  id: string;
  owner_id: string;
  username?: string;
};

type ServerProps = {
  server?: Server[];
  onToggleTheme?: () => void;
  parent?: (serverId: string) => void;
  getServer?: () => void;
};
// Backend token payload: {"sub": "<user_id>", "username": "<username>"}
type TokenPayload = { sub: string; username?: string };

const ServerSidebar = ({
  getServer,
  server,
  parent,
  onToggleTheme,
}: ServerProps) => {
  const [activeId, setActiveId] = useState<string>("home");
  const [open, setOpen] = useState(false);
  const [show, setShow] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const { logout } = useAuthStore();
  // Close profile popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [open]);

  const createServer = () => {
    setShow(true);
  };

  const tokenForUser = getToken();
  const userName = tokenForUser
    ? jwtDecode<TokenPayload>(tokenForUser).username
    : undefined;

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
      <div className="server-list">
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
      </div>

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
            const token = getToken();
            if (!token) {
              console.error("No auth token found. User must be logged in.");
              return;
            }

            const payload: any = {
              name: String(values.name || "").trim(),
              // description is not used by the backend create_server route,
              // but we keep it in case the schema supports it later.
              description: String(values.description || "").trim(),
            };

            try {
              // Backend: POST /servers (admin_id comes from current_user via token)
              const res = await fetch(
                `${baseUrl}/servers`,
                options("POST", token, payload)
              );

              if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                console.error("Failed to create server", err);
                return;
              }

              await res.json();
              setShow(false);
              // Refresh server list after successful creation
              getServer?.();
            } catch (error) {
              console.error(error);
            }
          }}
        />
      )}
      <div className="profile-section">
        <button
          className="server-item profile-button"
          title="Toggle theme"
          onClick={onToggleTheme}
          aria-label="Toggle theme"
        >
          🌓
        </button>
        <div className="profile-anchor" ref={profileRef}>
          <button
            className="server-item profile-button"
            title="Profile"
            aria-label="Profile"
            onClick={() => setOpen((v) => !v)}
          >
            {userName?.[0]?.toUpperCase() || "U"}
          </button>
          {open && (
            <div className="profile-popover">
              <div className="profile-row">
                <div className="profile-avatar">
                  {userName?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="profile-meta">
                  <div className="profile-name">{userName || "User"}</div>
                  <div className="profile-sub">Signed in</div>
                </div>
              </div>
              <button className="profile-action" onClick={logout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServerSidebar;
