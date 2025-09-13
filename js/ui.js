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

/* ---------- Solo Love Wrapped ---------- */
export function renderWrapped(container, model) {
  if (!model) {
    container.innerHTML = `
      <div class="wrapped">
        <div class="wrap-head">
          <h2>My Love Wrapped</h2>
          <p class="muted">Log in with Spotify to see your cute stats 💞</p>
        </div>
      </div>`;
    return;
  }
  const { displayName, topArtists=[], topTracks=[], mood={valence:0,energy:0,danceability:0} } = model;
  container.innerHTML = `
    <div class="wrapped">
      <div class="wrap-head">
        <h2>${escapeHtml(displayName)} — Love Wrapped</h2>
        <p class="muted">Based on your recent listening</p>
      </div>

      <div class="cards">
        <div class="card">
          <h3>Top Artists</h3>
          ${
            topArtists.length
              ? `<ol>${topArtists.slice(0,5).map(a=>`<li>${escapeHtml(a.name)}</li>`).join("")}</ol>`
              : `<p class="muted">No artists yet.</p>`
          }
        </div>

        <div class="card">
          <h3>Top Tracks</h3>
          ${
            topTracks.length
              ? `<ol>${topTracks.slice(0,5).map(t=>{
                  const artist = t.artists?.[0]?.name || "Unknown";
                  return `<li>${escapeHtml(t.name)} — <span class="muted">${escapeHtml(artist)}</span></li>`;
                }).join("")}</ol>`
              : `<p class="muted">No tracks yet.</p>`
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

/* ---------- Us Wrapped (combined) ---------- */
export function renderUsWrapped(container, me, partner) {
  if (!me || !partner) {
    container.innerHTML = `<div class="placeholder"><h2>Us Wrapped</h2><p>Import your partner’s JSON to see a combined view 💗</p></div>`;
    return;
  }

  const sharedArtists = intersect(me.topArtists.map(a=>a.id), partner.topArtists.map(a=>a.id));
  const sharedTracks  = intersect(me.topTracks.map(t=>t.id),  partner.topTracks.map(t=>t.id));
  const simArtists = jaccard(me.topArtists.map(a=>a.id), partner.topArtists.map(a=>a.id));
  const simTracks  = jaccard(me.topTracks.map(t=>t.id),  partner.topTracks.map(t=>t.id));

  const blendedMood = {
    valence: (me.mood.valence + partner.mood.valence)/2 || 0,
    energy: (me.mood.energy + partner.mood.energy)/2 || 0,
    danceability: (me.mood.danceability + partner.mood.danceability)/2 || 0
  };

  container.innerHTML = `
    <div class="wrapped">
      <div class="wrap-head">
        <h2>Us Wrapped</h2>
        <p class="muted">A cute mashup of ${escapeHtml(me.displayName)} and ${escapeHtml(partner.displayName)} 💗</p>
      </div>

      <div class="grid-2">
        <div class="card">
          <h3>${escapeHtml(me.displayName)}</h3>
          <p class="muted">Top artist: ${escapeHtml(me.topArtists[0]?.name || "—")}</p>
          <p class="muted">Top track: ${escapeHtml(me.topTracks[0]?.name || "—")}</p>
        </div>

        <div class="card">
          <h3>${escapeHtml(partner.displayName)}</h3>
          <p class="muted">Top artist: ${escapeHtml(partner.topArtists[0]?.name || "—")}</p>
          <p class="muted">Top track: ${escapeHtml(partner.topTracks[0]?.name || "—")}</p>
        </div>
      </div>

      <div class="cards" style="margin-top:12px">
        <div class="card">
          <h3>Shared Artists (${sharedArtists.length})</h3>
          <ol>${
            namesFromIds(sharedArtists, [...me.topArtists, ...partner.topArtists])
              .slice(0,8).map(n=>`<li>${escapeHtml(n)}</li>`).join("") || "<p class='muted'>None yet</p>"
          }</ol>
        </div>

        <div class="card">
          <h3>Shared Tracks (${sharedTracks.length})</h3>
          <ol>${
            namesFromIds(sharedTracks, [...me.topTracks, ...partner.topTracks])
              .slice(0,8).map(n=>`<li>${escapeHtml(n)}</li>`).join("") || "<p class='muted'>None yet</p>"
          }</ol>
        </div>

        <div class="card us-mood">
          <h3>Blended Mood</h3>
          <div class="meter">
            ${meterRow("Happiness (valence)", blendedMood.valence)}
            ${meterRow("Energy", blendedMood.energy)}
            ${meterRow("Danceability", blendedMood.danceability)}
          </div>
          <p class="muted">Similarity — Artists: ${(simArtists*100|0)}% · Tracks: ${(simTracks*100|0)}%</p>
        </div>
      </div>
    </div>
  `;
}

/* ---------- helpers ---------- */
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
function intersect(a,b){ const B=new Set(b); return [...new Set(a)].filter(x=>B.has(x)); }
function jaccard(a,b){ const A=new Set(a), B=new Set(b); const inter=[...A].filter(x=>B.has(x)).length; const uni=new Set([...A,...B]).size; return uni? inter/uni : 0; }
function namesFromIds(ids, objects){
  const byId = new Map(objects.map(o=>[o.id, o.name]));
  return ids.map(id=>byId.get(id)).filter(Boolean);
}
function escapeHtml(s = "") {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
