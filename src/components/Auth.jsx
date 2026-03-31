import { useState } from "react";
import { supabase } from "../supabase";
import { Btn, Lbl } from "./ui";

// Username → fake email mapping (Supabase Auth needs an email)
const toEmail = u => `${u.toLowerCase().trim()}@businesshub.app`;

export default function Auth() {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!username.trim() || !pwd.trim()) { setErr("Remplissez tous les champs."); return; }
    if (mode === "register" && pwd !== pwd2) { setErr("Les mots de passe ne correspondent pas."); return; }
    if (pwd.length < 6) { setErr("Mot de passe trop court (6 caractères minimum)."); return; }
    if (!/^[a-zA-Z0-9_.-]+$/.test(username)) { setErr("Nom d'utilisateur invalide (lettres, chiffres, _ . - uniquement)."); return; }

    setLoading(true); setErr("");
    const email = toEmail(username);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pwd });
      if (error) setErr(error.message === "Invalid login credentials" ? "Identifiants incorrects." : error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password: pwd });
      if (error) setErr(error.message.includes("already registered") ? "Nom d'utilisateur déjà pris." : error.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: 20 }}>
      <div style={{ background: "var(--w)", borderRadius: 20, padding: "40px 36px", maxWidth: 380, width: "100%", border: "1px solid var(--brd)", boxShadow: "0 20px 60px rgba(0,0,0,.1)" }}>
        <p style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-.02em", marginBottom: 4 }}>
          Business<span style={{ color: "var(--ac)" }}>Hub</span>
        </p>
        <p style={{ fontSize: 13, color: "var(--sub)", marginBottom: 32 }}>
          {mode === "login" ? "Connectez-vous à votre espace." : "Créez votre espace de gestion."}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <Lbl>Nom d'utilisateur</Lbl>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="votre_nom"
              autoComplete="username"
              onKeyDown={e => e.key === "Enter" && submit()}
            />
          </div>
          <div>
            <Lbl>Mot de passe</Lbl>
            <input
              type="password"
              value={pwd}
              onChange={e => setPwd(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              onKeyDown={e => e.key === "Enter" && submit()}
            />
          </div>
          {mode === "register" && (
            <div>
              <Lbl>Confirmer le mot de passe</Lbl>
              <input
                type="password"
                value={pwd2}
                onChange={e => setPwd2(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                onKeyDown={e => e.key === "Enter" && submit()}
              />
            </div>
          )}
          {err && (
            <p style={{ fontSize: 12, color: "var(--err)", padding: "8px 12px", background: "rgba(220,38,38,.08)", borderRadius: 8 }}>{err}</p>
          )}
          <Btn variant="pri" onClick={submit} full style={{ marginTop: 4, padding: "11px 18px" }} disabled={loading}>
            {loading ? "Chargement…" : mode === "login" ? "Se connecter" : "Créer mon compte"}
          </Btn>
          <button
            onClick={() => { setMode(m => m === "login" ? "register" : "login"); setErr(""); }}
            style={{ background: "none", border: "none", color: "var(--ac)", fontSize: 12, cursor: "pointer", fontFamily: "inherit", textAlign: "center" }}>
            {mode === "login" ? "Pas encore de compte ? S'inscrire →" : "Déjà un compte ? Se connecter →"}
          </button>
        </div>
      </div>
    </div>
  );
}
