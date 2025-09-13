// js/auth.js
import { SPOTIFY_CLIENT_ID, REDIRECT_URI, SCOPES } from "./config.js";

const AUTH_ENDPOINT  = "https://accounts.spotify.com/authorize";
const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";

// ---- Helpers ----
const b64url = (bytes) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");

const randomString = (len=64) => {
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  // base64url then strip non-alnum just to be safe & short
  return b64url(arr).replace(/[^a-zA-Z0-9_-]/g,"").slice(0,len);
};

// ---- PKCE: create code_verifier & code_challenge ----
export async function createPKCE() {
  const verifier  = randomString(64);
  const digest    = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  const challenge = b64url(new Uint8Array(digest));
  localStorage.setItem("pkce_verifier", verifier);
  return challenge;
}

// ---- Start login redirect ----
export async function login() {
  const challenge = await createPKCE();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: SPOTIFY_CLIENT_ID,
    scope: SCOPES.join(" "),
    redirect_uri: REDIRECT_URI,
    code_challenge_method: "S256",
    code_challenge: challenge
  });
  window.location = `${AUTH_ENDPOINT}?${params.toString()}`;
}

// ---- Handle redirect back from Spotify (exchange code for token) ----
export async function handleRedirect() {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  if (!code) return null;

  const verifier = localStorage.getItem("pkce_verifier");
  if (!verifier) return null;

  const body = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: verifier
  });

  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type":"application/x-www-form-urlencoded" },
    body
  });
  const data = await res.json();

  if (data.access_token) {
    const expiresAt = Date.now() + (data.expires_in * 1000) - 60000; // refresh 1m early
    localStorage.setItem("spotify_token", data.access_token);
    localStorage.setItem("spotify_exp", String(expiresAt));
    localStorage.removeItem("pkce_verifier");

    // Clean ?code= from URL for a pretty page
    url.searchParams.delete("code");
    history.replaceState({}, "", url.toString());
    return data.access_token;
  } else {
    console.error("Token error:", data);
    return null;
  }
}

export function getToken() {
  const token = localStorage.getItem("spotify_token");
  const exp   = Number(localStorage.getItem("spotify_exp") || 0);
  if (token && Date.now() < exp) return token;
  return null;
}

export function logout() {
  ["spotify_token","spotify_exp","pkce_verifier"].forEach(k => localStorage.removeItem(k));
  location.reload();
}
