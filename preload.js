const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  sendPrompt: (prompt) => ipcRenderer.send("send-prompt", prompt),
  onResponse: (callback) =>
    ipcRenderer.on("response", (event, data) => callback(data)),
  onResponseEnd: (callback) =>
    ipcRenderer.on("response-end", (event, data) => callback(data)),

  clearHistory: () => ipcRenderer.send("clear-history"),
  onHistoryCleared: (callback) =>
    ipcRenderer.on("history-cleared", (event) =>
      callback("The history has been cleared")
    ),

  cancelRequest: () => ipcRenderer.send("cancel-request"),
  onCancelRequest: (callback) =>
    ipcRenderer.on("canceled-request", (event) =>
      callback("The request was canceled")
    ),
});
