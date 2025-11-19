import { useEffect, useRef, useState } from "react";

type ChatHeaderProps = {
  onOpenSidebar?: () => void;
  onToggleTheme?: () => void;
  onLogout?: () => void;
  userName?: string;
  roomName?: string;
};

export default function ChatHeader({
  onOpenSidebar,
  onToggleTheme,
  onLogout,
  userName,
  roomName,
}: ChatHeaderProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <header className="chat-header">
      <button
        className="menu"
        aria-label="Open sidebar"
        onClick={onOpenSidebar}
      >
        ☰
      </button>
      {roomName && <div className="chat-title">{roomName.toUpperCase()}</div>}
      {/* <button className="circle" title="Toggle theme" onClick={onToggleTheme}>
        🌓
      </button>
      <div className="profile-anchor" ref={menuRef}>
        <button className="circle" title="Profile" aria-label="Profile" onClick={() => setOpen((v) => !v)}>
          {userName?.[0]?.toUpperCase() || 'U'}
        </button>
        {open && (
          <div className="profile-popover">
            <div className="profile-row">
              <div className="profile-avatar">{userName?.[0]?.toUpperCase() || 'U'}</div>
              <div className="profile-meta">
                <div className="profile-name">{userName || 'User'}</div>
                <div className="profile-sub">Signed in</div>
              </div>
            </div>
            <button className="profile-action" onClick={onLogout}>Logout</button>
          </div>
        )}
      </div> */}
    </header>
  );
}
