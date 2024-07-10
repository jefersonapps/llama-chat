const form = document.querySelector("form");
const output = document.querySelector("#output");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const prompt = document.querySelector("#prompt").value;
  window.electronAPI.sendPrompt(prompt);
});

window.electronAPI.onResponse((response) => {
  output.innerText += response;
});
