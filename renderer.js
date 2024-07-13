const chatContainer = document.getElementById("chat-container");
const promptInput = document.getElementById("prompt");
const reloadChat = document.getElementById("reload-chat");
const cancelRequestBtn = document.getElementById("cancel-request");
const form = document.getElementById("form");

let assistMessageContainer = null;
let assistantMessageElement = null;
let stopGenerating = false;
let isLoading = false;

form.addEventListener("submit", sendPrompt);
reloadChat.addEventListener("click", cleanHistory);
cancelRequestBtn.addEventListener("click", cancelRequest);
promptInput.addEventListener("keyup", validateSubmitButton);
promptInput.addEventListener("keydown", handleShiftEnter);
promptInput.addEventListener("input", adjustInputHeight);

function scrollToBottom() {
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function sendPrompt(event) {
  event.preventDefault();
  stopGenerating = false;
  reloadChat.disabled = false;
  promptInput.style.height = "48px";
  chatContainer.style.height = "calc(100vh - 50px - 60px)";

  const formData = new FormData(event.currentTarget);
  const prompt = formData.get("prompt").trim();
  if (!prompt || isLoading) return;

  appendMessage("user", prompt);

  assistMessageContainer = document.createElement("div");
  assistantMessageElement = document.createElement("div");

  assistMessageContainer.classList.add("assist-message-container");
  assistMessageContainer.appendChild(assistantMessageElement);
  chatContainer.appendChild(assistMessageContainer);

  document.getElementById("loading").classList.remove("hidden");
  isLoading = true;
  document.getElementById("send-icon").classList.add("hidden");
  window.api.sendPrompt(prompt);
  event.currentTarget.reset();
  document.querySelector("#submit-btn").disabled = true;
  scrollToBottom();
}

function cleanHistory() {
  window.api.clearHistory();
}

function cancelRequest() {
  stopGenerating = true;
  window.api.cancelRequest();
}

function appendMessage(role, content) {
  if (stopGenerating || !content) return;

  if (role === "assistant" && assistantMessageElement) {
    document.querySelector("#cancel-request").disabled = false;
    const formattedContent = content
      .replace(/\n/g, "<br>")
      .replace(/  /g, "&nbsp;&nbsp;");
    assistantMessageElement.classList.add("message", "assistant");
    assistantMessageElement.innerHTML += formattedContent;
  } else {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message", role);
    messageElement.innerHTML = content
      .replace(/\n/g, "<br>")
      .replace(/  /g, "&nbsp;&nbsp;");
    chatContainer.appendChild(messageElement);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
}

function handleShiftEnter(event) {
  if (event.ctrlKey && event.key === "Enter") {
    event.preventDefault();
    document.querySelector("form").dispatchEvent(new Event("submit"));
  }
}

function adjustInputHeight() {
  promptInput.style.height = "50px";
  const inputHeight = Math.min(promptInput.scrollHeight, 300) + "px";
  promptInput.style.height = inputHeight;
  const padding = "60px";
  const borders = "2px";
  chatContainer.style.height = `calc(100vh - ${inputHeight} - ${padding} - ${borders})`;
}

function validateSubmitButton() {
  document.getElementById("submit-btn").disabled =
    promptInput.value === "" || isLoading;
}

function resetState() {
  document.getElementById("loading").classList.add("hidden");
  isLoading = false;
  document.getElementById("send-icon").classList.remove("hidden");
  validateSubmitButton();
  document.querySelector("#cancel-request").disabled = true;
  assistantMessageElement = null;
  assistMessageContainer = null;
  stopGenerating = true;
}

window.api.onResponse((data) => appendMessage("assistant", data));
window.api.onCancelRequest(() => {
  document.querySelector("#cancel-request").disabled = true;
  resetState();
});
window.api.onHistoryCleared(() => {
  chatContainer.innerHTML = null;
  reloadChat.disabled = true;
  resetState();
});
window.api.onResponseEnd(resetState);
