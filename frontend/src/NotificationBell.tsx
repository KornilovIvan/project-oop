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
      <button onClick={() => setOpen(!open)} className="keycap-btn keycap-btn-outline" style={{ fontSize: 13, padding: "4px 10px", position: "relative" }}>
        🔔
        {invitations.length > 0 && (
          <span style={{ position: "absolute", top: -4, right: -4, background: "#222", color: "#fff", fontSize: 10, width: 16, height: 16, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
            {invitations.length}
          </span>
        )}
      </button>
      {open && invitations.length > 0 && (
        <div style={{ position: "absolute", right: 0, top: "100%", marginTop: 8, background: "#fff", border: "1px solid #ddd", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", minWidth: 280, zIndex: 2000, padding: 8 }}>
          {invitations.map(inv => (
            <div key={inv.id} style={{ padding: "8px 0", borderBottom: "1px solid #eee", fontSize: 13 }}>
              <div style={{ marginBottom: 6, color: "#333" }}>
                <strong>{inv.invitedByUsername}</strong> invited you to <strong>{inv.projectName}</strong>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button disabled={busy === inv.id} onClick={() => handleAccept(inv)} className="keycap-btn keycap-btn-solid" style={{ fontSize: 11, padding: "4px 10px" }}>
                  {busy === inv.id ? "..." : "Accept"}
                </button>
                <button disabled={busy === inv.id} onClick={() => handleReject(inv)} className="keycap-btn keycap-btn-ghost" style={{ fontSize: 11, padding: "4px 10px" }}>
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {open && invitations.length === 0 && (
        <div style={{ position: "absolute", right: 0, top: "100%", marginTop: 8, background: "#fff", border: "1px solid #ddd", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", minWidth: 200, zIndex: 2000, padding: 12, fontSize: 13, color: "#999" }}>
          No invitations
        </div>
      )}
    </div>
  );
}
