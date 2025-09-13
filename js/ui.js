// Minimal placeholders; we’ll replace with the real cassette & wrapped UIs later.
export function renderCassette(section){
  section.innerHTML = `
    <div class="cassette">
      <div class="label">
        <span>Mixtape for You 💖 — Side A</span>
        <button class="flip">Flip</button>
      </div>
      <div class="window">[Spotify playlist embed goes here]</div>
    </div>`;
}
export function wireCassette(section, onFlip){
  section.addEventListener("click", e => { if(e.target.matches(".flip")) onFlip(); });
}
export function renderWrapped(container){
  container.innerHTML = `
    <div class="wrapped">
      <div class="wrap-head">
        <h3>Love Wrapped</h3>
        <p class="muted">Log in with Spotify to generate stats.</p>
      </div>
    </div>`;
}
