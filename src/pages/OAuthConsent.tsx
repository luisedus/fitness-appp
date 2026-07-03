import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type AuthDetails = {
  client?: { name?: string; logo_uri?: string; client_uri?: string };
  redirect_url?: string;
  redirect_to?: string;
  scopes?: string[];
};

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<AuthDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Missing authorization_id");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/?next=" + encodeURIComponent(next);
        return;
      }
      const { data, error } = await supabase.auth.oauth.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) {
        setError(error.message);
        return;
      }
      const anyData = data as unknown as AuthDetails;
      const immediate = anyData?.redirect_url ?? anyData?.redirect_to;
      if (immediate && !anyData?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(anyData);
    })();
    return () => { active = false; };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    const oauth = supabase.auth.oauth;
    const { data, error } = approve
      ? await oauth.approveAuthorization(authorizationId)
      : await oauth.denyAuthorization(authorizationId);
    if (error) { setBusy(false); setError(error.message); return; }
    const anyData = data as unknown as AuthDetails;
    const target = anyData?.redirect_url ?? anyData?.redirect_to;
    if (!target) { setBusy(false); setError("No redirect returned by authorization server."); return; }
    window.location.href = target;
  }

  const containerStyle: React.CSSProperties = {
    minHeight: "100vh", background: "hsl(var(--carbon))",
    display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem",
  };
  const cardStyle: React.CSSProperties = {
    width: "100%", maxWidth: "460px", borderRadius: "1rem", padding: "2.25rem",
  };

  if (error) return (
    <div style={containerStyle}>
      <div className="glass-card" style={cardStyle}>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.8rem" }}>
          <span style={{ color: "hsl(var(--foreground))" }}>AUTHORIZATION </span>
          <span style={{ color: "hsl(var(--destructive))" }}>ERROR</span>
        </h1>
        <p style={{ color: "hsl(var(--smoke))", fontSize: "0.9rem", marginTop: "1rem" }}>
          Could not load this authorization request: {error}
        </p>
      </div>
    </div>
  );

  if (!details) return (
    <div style={containerStyle}>
      <div style={{ color: "hsl(var(--smoke))" }}>Loading authorization…</div>
    </div>
  );

  const clientName = details.client?.name ?? "an app";

  return (
    <div style={containerStyle}>
      <div className="glass-card" style={cardStyle}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem", textAlign: "center" }}>🔗</div>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.8rem", textAlign: "center", marginBottom: "0.75rem" }}>
          <span style={{ color: "hsl(var(--foreground))" }}>CONNECT </span>
          <span style={{ color: "hsl(var(--neon))" }}>{clientName.toUpperCase()}</span>
        </h1>
        <p style={{ color: "hsl(var(--smoke))", fontSize: "0.9rem", textAlign: "center", marginBottom: "1.5rem", lineHeight: 1.5 }}>
          This will let <strong style={{ color: "hsl(var(--foreground))" }}>{clientName}</strong> access GYMBRO'S as you — read your profile, activity, and manage your training level.
        </p>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button className="btn-neon" disabled={busy} onClick={() => decide(true)} style={{ flex: 1 }}>
            {busy ? "…" : "APROBAR"}
          </button>
          <button className="btn-ghost" disabled={busy} onClick={() => decide(false)} style={{ flex: 1 }}>
            RECHAZAR
          </button>
        </div>
      </div>
    </div>
  );
}
