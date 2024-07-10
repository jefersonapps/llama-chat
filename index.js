const { app, BrowserWindow, globalShortcut, ipcMain } = require("electron");
const path = require("path");
const axios = require("axios");

let mainWindow = null;
let conversationHistory = [];
let cancelTokenSource = null;
let isRequestCanceled = false;
let assistantResponse = "";

function createWindow() {
  mainWindow = new BrowserWindow({
    minHeight: 300,
    minWidth: 400,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.loadFile("index.html");

  mainWindow.on("close", (event) => {
    if (cancelTokenSource) {
      cancelTokenSource.cancel("Requisição cancelada: Aplicativo fechando.");
      cancelTokenSource = null;
    }
  });

  globalShortcut.register("CommandOrControl+L", () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.on("send-prompt", async (event, prompt) => {
  console.log(conversationHistory);
  try {
    isRequestCanceled = false;

    if (cancelTokenSource) {
      cancelTokenSource.cancel("");
    }

    cancelTokenSource = axios.CancelToken.source();

    conversationHistory.push({ role: "user", content: prompt });

    const response = await axios.post(
      "http://localhost:11434/api/chat",
      {
        model: "llama3",
        messages: conversationHistory,
        stream: true,
      },
      {
        responseType: "stream",
        cancelToken: cancelTokenSource.token,
      }
    );

    response.data.on("data", (chunk) => {
      if (isRequestCanceled) {
        return;
      }
      const lines = chunk.toString().split("\n");
      lines.forEach((line) => {
        if (line.trim()) {
          const data = JSON.parse(line);

          if (data.done) {
            conversationHistory.push({
              role: "assistant",
              content: assistantResponse,
            });
            assistantResponse = "";
            event.sender.send("response-end");
          } else {
            assistantResponse += data.message.content;
            event.sender.send("response", data.message.content);
          }
        }
      });
    });

    response.data.on("error", (error) => {
      event.sender.send("response", `${error.message}`);
    });
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log("Requisição cancelada:", error.message);
    } else {
      event.sender.send("response", `${error.message}`);
    }
  }
});

ipcMain.on("clear-history", (event) => {
  if (cancelTokenSource) {
    cancelTokenSource.cancel("");
    cancelTokenSource = null;
  }
  assistantResponse = "";
  conversationHistory = [];
  event.sender.send("history-cleared");
});

ipcMain.on("cancel-request", (event) => {
  if (cancelTokenSource) {
    isRequestCanceled = true;
    cancelTokenSource.cancel("");
    cancelTokenSource = null;
    event.sender.send("canceled-request");
    if (assistantResponse) {
      conversationHistory.push({
        role: "assistant",
        content: assistantResponse,
      });
    }
  }
});
