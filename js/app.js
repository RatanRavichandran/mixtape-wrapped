import { login, handleRedirect, getToken, logout } from "./auth.js";
import { renderCassette, wireCassette, renderWrapped } from "./ui.js";

const $ = s => document.querySelector(s);

function initCassette(){
  const sec = $("#cassette");
  renderCassette(sec);
  wireCassette(sec, () => alert("Flip logic will be wired later 🌀"));
}

async function main(){
  initCassette();
  renderWrapped($("#wrapped"));

  $("#login").addEventListener("click", login);
  $("#logout").addEventListener("click", logout);
  await handleRedirect(); // no-op for now
}
main();
