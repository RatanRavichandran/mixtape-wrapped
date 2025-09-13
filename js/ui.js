// js/ui.js
import { PLAYLIST_SIDE_A, PLAYLIST_SIDE_B } from "./config.js";

/* ---------- Cassette (Mixtape) ---------- */
export function renderCassette(section, side = "A") {
  const pid = side === "A" ? PLAYLIST_SIDE_A : PLAYLIST_SIDE_B;
  const other = side === "A" ? "B" : "A";
  section.innerHTML = `
    <div class="cassette">
      <div class="label">
        <span>Mixtape for You 💖 — Side ${side}</span>
        <button class="flip">Flip to Side ${other}</button>
      </div>
      <div class="reels">
        <div class="reel reel-left"></div>
        <div class="reel reel-right"></div>
      </div>
      <div class="window">
        ${
          pid
            ? `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/playlist/${pid}?utm_source=generator"
                 width="100%" height="152" frameborder="0"
                 allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
            : `<div class="placeholder">Add your playlist ID for Side ${side} in <code>js/config.js</code>.</div>`
        }
      </div>
    </div>
  `;
}

export function wireCassette(section, onFlip) {
  section.addEventListener("click", (e) => {
    if (e.target.matches(".flip")) onFlip();
  });
}

/* ---------- Love Wrapped ---------- */
export function renderWrapped(container, model) {
  // If no model (not logged in yet), show placeholder
  if (!model) {
    container.innerHTML = `
      <div class="wrapped">
        <div class="wrap-head">
          <h2>Love Wrapped</h2>
          <p class="muted">Log in with Spotify to see your cute stats 💞</p>
        </div>
      </div>`;
    return;
  }

  const {
    topArtists = [],
    topTracks = [],
    mood = { valence: 0, energy: 0, danceability: 0 },
  } = model;

  container.innerHTML = `
    <div class="wrapped">
      <div class="wrap-head">
        <h2>Love Wrapped</h2>
        <p class="muted">Based on your recent listening 💕</p>
      </div>

      <div class="cards">
        <div class="card">
          <h3>Top Artists</h3>
          ${
            topArtists.length
              ? `<ol>${topArtists.slice(0, 5).map(a => `<li>${escapeHtml(a.name)}</li>`).join("")}</ol>`
              : `<p class="muted">No artists yet.</p>`
          }
        </div>

        <div class="card">
          <h3>Top Tracks</h3>
          ${
            topTracks.length
              ? `<ol>${topTracks.slice(0, 5).map(t => {
                  const artist = (t.artists && t.artists[0] && t.artists[0].name) ? t.artists[0].name : "Unknown";
                  return `<li>${escapeHtml(t.name)} — <span class="muted">${escapeHtml(artist)}</span></li>`;
                }).join("")}</ol>`
              : `<p class="muted">No tracks yet. Make sure the app has scope <code>user-top-read</code>.</p>`
          }
        </div>

        <div class="card">
          <h3>Mood Meter</h3>
          <div class="meter">
            ${meterRow("Happiness (valence)", mood.valence)}
            ${meterRow("Energy", mood.energy)}
            ${meterRow("Danceability", mood.danceability)}
          </div>
        </div>
      </div>
    </div>
  `;
}

function meterRow(label, value = 0) {
  const pct = Math.max(0, Math.min(100, Math.round((value || 0) * 100)));
  return `
    <div class="row">
      <span>${label}</span>
      <div class="bar"><div class="fill" style="width:${pct}%"></div></div>
      <span class="pct">${pct}%</span>
    </div>
  `;
}

function escapeHtml(s = "") {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
