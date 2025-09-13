// js/app.js
import { login, handleRedirect, getToken, logout } from "./auth.js";
import { renderCassette, wireCassette, renderWrapped } from "./ui.js";

const $ = (s) => document.querySelector(s);
const api = (path, token) =>
  fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => r.json());

function initCassette() {
  let side = "A";
  const sec = $("#cassette");
  const paint = () => renderCassette(sec, side);
  paint();
  wireCassette(sec, () => {
    side = side === "A" ? "B" : "A";
    paint();
  });
}

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

async function buildWrapped(token) {
  // Fetch top tracks & artists
  const [tracks, artists] = await Promise.all([
    api(`/me/top/tracks?limit=10&time_range=medium_term`, token),
    api(`/me/top/artists?limit=10&time_range=medium_term`, token),
  ]);

  // Audio features for mood bars
  const ids = (tracks.items || []).map((t) => t.id).join(",");
  const feats = ids
    ? await api(`/audio-features?ids=${ids}`, token)
    : { audio_features: [] };

  const mood = avgMood(feats.audio_features);

  // Render final model
  renderWrapped($("#wrapped"), {
    topArtists: artists.items || [],
    topTracks: tracks.items || [],
    mood,
  });

  document.body.classList.add("authed");
}

async function main() {
  initCassette();
  renderWrapped($("#wrapped")); // placeholder before auth

  $("#login").addEventListener("click", login);
  $("#logout").addEventListener("click", logout);

  // Handle redirect and/or cached token
  const tokenFromRedirect = await handleRedirect();
  const token = tokenFromRedirect || getToken();
  if (token) await buildWrapped(token);
}

main();
