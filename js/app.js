// js/app.js
import { login, handleRedirect, getToken, logout } from "./auth.js";
import { renderCassette, wireCassette, renderWrapped } from "./ui.js";

const $ = s => document.querySelector(s);
const api = (path, token) =>
  fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(r => r.json());

function initCassette(){
  const sec = $("#cassette");
  renderCassette(sec);
  wireCassette(sec, () => alert("Flip logic will be wired later 🌀"));
}

function avgMood(features=[]) {
  if (!features.length) return { valence:0, energy:0, danceability:0 };
  const sum = features.reduce((a,f)=>({
    valence: a.valence + (f?.valence||0),
    energy: a.energy + (f?.energy||0),
    danceability: a.danceability + (f?.danceability||0),
  }), {valence:0,energy:0,danceability:0});
  return {
    valence: sum.valence / features.length,
    energy: sum.energy / features.length,
    danceability: sum.danceability / features.length
  };
}

async function buildWrapped(token){
  // Basic placeholder call to verify auth works (we’ll enhance in a later step)
  const tracks = await api(`/me/top/tracks?limit=5&time_range=medium_term`, token);
  const ids = (tracks.items||[]).map(t=>t.id).join(",");
  const feats = ids ? await api(`/audio-features?ids=${ids}`, token) : { audio_features: [] };
  const mood = avgMood(feats.audio_features);

  renderWrapped($("#wrapped"), {
    topArtists: [],                 // fill later
    topTracks:  tracks.items || [], // show some data to confirm
    mood
  });

  document.body.classList.add("authed");
}

async function main(){
  initCassette();
  renderWrapped($("#wrapped"));

  $("#login").addEventListener("click", login);
  $("#logout").addEventListener("click", logout);

  // If redirected back from Spotify, exchange code → token
  const tokenFromRedirect = await handleRedirect();
  const token = tokenFromRedirect || getToken();
  if (token) await buildWrapped(token);
}
main();
