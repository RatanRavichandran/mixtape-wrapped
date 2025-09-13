// js/app.js — wiring, Spotify calls, export/import
import { login, handleRedirect, getToken, logout } from "./auth.js";
import { renderCassette, wireCassette, renderWrapped, renderUsWrapped } from "./ui.js";

const $ = (s) => document.querySelector(s);
const api = (path, token) =>
  fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => r.json());

// ---------- cassette ----------
function initCassette() {
  let side = "A";
  const sec = $("#cassette");
  const paint = () => renderCassette(sec, side);
  paint();
  wireCassette(sec, () => { side = side === "A" ? "B" : "A"; paint(); });
}

// ---------- mood ----------
function avgMood(features = []) {
  if (!features.length) return { valence: 0, energy: 0, danceability: 0 };
  const sum = features.reduce(
    (a, f) => ({
      valence: a.valence + (f?.valence || 0),
      energy: a.energy + (f?.energy || 0),
      danceability: a.danceability + (f?.danceability || 0),
    }),
    { valence: 0, energy: 0, danceability: 0 }
  );
  return {
    valence: sum.valence / features.length,
    energy: sum.energy / features.length,
    danceability: sum.danceability / features.length,
  };
}

// ---------- build a full model for the logged-in user ----------
async function buildModel(token){
  const me = await api(`/me`, token); // profile
  const [tracks, artists] = await Promise.all([
    api(`/me/top/tracks?limit=20&time_range=medium_term`, token),
    api(`/me/top/artists?limit=20&time_range=medium_term`, token),
  ]);
  const ids = (tracks.items || []).map(t => t.id).join(",");
  const feats = ids ? await api(`/audio-features?ids=${ids}`, token) : { audio_features: [] };
  const mood = avgMood(feats.audio_features);

  return {
    userId: me.id,
    displayName: me.display_name || "You",
    topArtists: artists.items || [],
    topTracks: tracks.items || [],
    mood
  };
}

// ---------- storage helpers (browser only) ----------
const saveMe = (model)    => localStorage.setItem("me_model", JSON.stringify(model));
const savePartner = (m)   => localStorage.setItem("partner_model", JSON.stringify(m));
const loadMe = ()         => JSON.parse(localStorage.getItem("me_model") || "null");
const loadPartner = ()    => JSON.parse(localStorage.getItem("partner_model") || "null");
const clearAll = ()       => { ["me_model","partner_model","spotify_token","spotify_exp","pkce_verifier"].forEach(localStorage.removeItem.bind(localStorage)); };

// ---------- export/import ----------
// ---------- export/import ----------
function downloadJSON(filename, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], {type: "application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function wireExportImport() {
  const btnExport = $("#exportMe");
  const btnImport = $("#importPartner");
  const inputFile = $("#importFile");
  const btnClear  = $("#clearAll");

  if (!btnExport || !btnImport || !inputFile || !btnClear) {
    console.warn("Export/Import controls not found in DOM.");
    return;
  }

  btnExport.addEventListener("click", () => {
    const me = loadMe();
    if (!me) { alert("Log in first to generate your stats."); return; }
    const safeName = (me.displayName || "me").replace(/[^\w\-]+/g,"_");
    downloadJSON(`wrapped_${safeName}.json`, me);
  });

  btnImport.addEventListener("click", () => inputFile.click());

  inputFile.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      // quick validation
      if (!data || !data.displayName || !Array.isArray(data.topTracks) || !data.mood) {
        alert("This file doesn't look like a Wrapped JSON.");
        return;
      }
      savePartner(data);
      renderAll();
      alert(`Imported partner: ${data.displayName}`);
    } catch (err) {
      console.error(err);
      alert("Couldn't read that file. Make sure it's the exported JSON.");
    } finally {
      e.target.value = ""; // reset for next import
    }
  });

  btnClear.addEventListener("click", () => { clearAll(); location.reload(); });
}

// ---------- render everything ----------
function renderAll(){
  const me = loadMe();
  const partner = loadPartner();

  renderWrapped($("#wrapped"), me);
  renderUsWrapped($("#us-wrapped"), me, partner);

  if (me) document.body.classList.add("authed");
}

// ---------- main ----------
async function main(){
  initCassette();
  wireExportImport();

  // buttons
  $("#login").addEventListener("click", login);
  $("#logout").addEventListener("click", logout);

  // handle redirect & token
  const tokenFromRedirect = await handleRedirect();
  const token = tokenFromRedirect || getToken();

  if (token) {
    const model = await buildModel(token);
    saveMe(model);
  }
  renderAll();
}
main();
