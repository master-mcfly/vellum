const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("vellum", {
  ask: (payload) => ipcRenderer.invoke("vellum:ask", payload),
  keyStatus: () => ipcRenderer.invoke("vellum:key-status"),
  setKey: (key) => ipcRenderer.invoke("vellum:set-key", key),
});
