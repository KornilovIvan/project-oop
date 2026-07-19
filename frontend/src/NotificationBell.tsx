import { useEffect, useRef, useState } from "react";
import { projectApi } from "./api";
import type { InvitationRes } from "./api";

export function NotificationBell({ onAccept }: { onAccept: (projectId: number) => void }) {
  const [invitations, setInvitations] = useState<InvitationRes[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const load = async () => {
    try {
      const list = await projectApi.listInvitations();
      setInvitations(list);
    } catch { /* ignore */ }
  };

  useEffect(() => { load(); const id = setInterval(load, 15000); return () => clearInterval(id); }, []);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const handleAccept = async (inv: InvitationRes) => {
    setBusy(inv.id);
    try {
      await projectApi.acceptInvitation(inv.id);
      onAccept(inv.projectId);
      setInvitations(prev => prev.filter(i => i.id !== inv.id));
    } catch { /* ignore */ }
    finally { setBusy(null); }
  };

  const handleReject = async (inv: InvitationRes) => {
    setBusy(inv.id);
    try {
      await projectApi.rejectInvitation(inv.id);
      setInvitations(prev => prev.filter(i => i.id !== inv.id));
    } catch { /* ignore */ }
    finally { setBusy(null); }
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(!open)} style={{ background: "none", border: "none", cursor: "pointer", position: "relative", padding: 6, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4, transition: "background 0.1s ease" }}
        onMouseEnter={e => e.currentTarget.style.background = "#f0f0f0"}
        onMouseLeave={e => e.currentTarget.style.background = "none"}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {invitations.length > 0 && (
          <span style={{ position: "absolute", top: 0, right: 0, background: "#222", color: "#fff", fontSize: 9, width: 16, height: 16, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
            {invitations.length}
          </span>
        )}
      </button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: "100%", marginTop: 8, background: "#fff", border: "1px solid #e0e0e0", borderRadius: 6, boxShadow: "0 4px 16px rgba(0,0,0,0.08)", minWidth: 280, zIndex: 2000, padding: 8 }}>
          {invitations.length > 0 ? (
            invitations.map(inv => (
              <div key={inv.id} style={{ padding: "8px 0", borderBottom: "1px solid #f0f0f0", fontSize: 13 }}>
                <div style={{ marginBottom: 8, color: "#333", lineHeight: 1.4 }}>
                  <strong>{inv.invitedByUsername}</strong> invited you to <strong>{inv.projectName}</strong>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button disabled={busy === inv.id} onClick={() => handleAccept(inv)} style={{ padding: "6px 14px", fontSize: 11, border: "1px solid #222", borderRadius: 4, background: "#222", color: "#fff", cursor: "pointer", fontWeight: 600, position: "relative", top: 0, boxShadow: "0 2px 0 #000", transition: "all 0.06s ease", opacity: busy === inv.id ? 0.5 : 1 }}
                    onMouseEnter={e => { if (busy !== inv.id) { e.currentTarget.style.top = "1px"; e.currentTarget.style.boxShadow = "0 1px 0 #000"; } }}
                    onMouseLeave={e => { if (busy !== inv.id) { e.currentTarget.style.top = "0"; e.currentTarget.style.boxShadow = "0 2px 0 #000"; } }}>
                    {busy === inv.id ? "..." : "Accept"}
                  </button>
                  <button disabled={busy === inv.id} onClick={() => handleReject(inv)} style={{ padding: "6px 14px", fontSize: 11, border: "1px solid #ddd", borderRadius: 4, background: "transparent", color: "#555", cursor: "pointer", fontWeight: 500, position: "relative", top: 0, boxShadow: "0 2px 0 #d0d0d0", transition: "all 0.06s ease", opacity: busy === inv.id ? 0.5 : 1 }}
                    onMouseEnter={e => { if (busy !== inv.id) { e.currentTarget.style.top = "1px"; e.currentTarget.style.boxShadow = "0 1px 0 #d0d0d0"; } }}
                    onMouseLeave={e => { if (busy !== inv.id) { e.currentTarget.style.top = "0"; e.currentTarget.style.boxShadow = "0 2px 0 #d0d0d0"; } }}>
                    Reject
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: 8, fontSize: 13, color: "#999", textAlign: "center" }}>No invitations</div>
          )}
        </div>
      )}
    </div>
  );
}
