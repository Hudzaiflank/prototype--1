function workerSocketUrl(namespace, auth) {
  const baseUrl = import.meta.env.VITE_REALTIME_URL;
  const url = new URL(baseUrl);
  if (url.protocol === "https:") url.protocol = "wss:";
  else if (url.protocol === "http:") url.protocol = "ws:";
  if (!["ws:", "wss:"].includes(url.protocol))
    throw new Error("VITE_REALTIME_URL must use HTTP or WebSocket protocol");

  url.pathname = `/realtime/${namespace}`;
  url.search = "";
  if (namespace === "game" && auth.gameSessionId)
    url.searchParams.set("gameSessionId", auth.gameSessionId);
  return url.toString();
}

export class WorkerSocket {
  constructor(namespace, auth) {
    this.namespace = namespace;
    this.auth = auth;
    this.url = workerSocketUrl(namespace, auth);
    this.listeners = new Map();
    this.pendingEvents = [];
    this.socket = null;
    this.connected = false;
    this.authenticated = false;
    this.manuallyClosed = false;
    this.reconnectTimer = null;
    this.reconnectDelay = 1000;
  }

  on(event, handler) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(handler);
    return this;
  }

  off(event, handler) {
    if (!handler) this.listeners.delete(event);
    else this.listeners.get(event)?.delete(handler);
    return this;
  }

  emit(event, payload = {}) {
    if (!this.authenticated) {
      if (
        !this.manuallyClosed &&
        this.socket &&
        [WebSocket.CONNECTING, WebSocket.OPEN].includes(this.socket.readyState)
      )
        this.pendingEvents.push({ event, payload });
      return this;
    }
    this.send({ event, payload });
    return this;
  }

  connect() {
    this.manuallyClosed = false;
    if (
      this.socket &&
      [WebSocket.CONNECTING, WebSocket.OPEN].includes(this.socket.readyState)
    )
      return this;

    const socket = new WebSocket(this.url);
    this.socket = socket;
    socket.addEventListener("open", () => {
      if (socket !== this.socket) return;
      this.send({ event: "authenticate", payload: this.auth });
    });
    socket.addEventListener("message", ({ data }) => {
      if (socket !== this.socket) return;
      let frame;
      try {
        frame = JSON.parse(data);
        if (!frame || typeof frame.event !== "string")
          throw new Error("Invalid realtime message");
      } catch (error) {
        console.error("Invalid realtime message received", error);
        return;
      }

      if (frame.event === "connect") {
        this.connected = true;
        this.authenticated = true;
        this.reconnectDelay = 1000;
      }
      this.dispatch(frame.event, frame.payload);
      if (frame.event === "connect") this.flushPendingEvents();
    });
    socket.addEventListener("close", ({ code, reason }) => {
      if (socket !== this.socket) return;
      const wasConnected = this.connected;
      this.connected = false;
      this.authenticated = false;
      if (wasConnected) this.dispatch("disconnect", reason);
      if (!this.manuallyClosed && code !== 1008) this.scheduleReconnect();
    });
    socket.addEventListener("error", (error) => {
      this.dispatch("connect_error", error);
    });
    return this;
  }

  disconnect() {
    this.manuallyClosed = true;
    this.pendingEvents = [];
    window.clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    this.socket?.close(1000, "Client disconnected");
    this.socket = null;
    const wasConnected = this.connected;
    this.connected = false;
    this.authenticated = false;
    if (wasConnected) this.dispatch("disconnect", "Client disconnected");
    return this;
  }

  send(frame) {
    if (this.socket?.readyState === WebSocket.OPEN)
      this.socket.send(JSON.stringify(frame));
  }

  dispatch(event, payload) {
    for (const handler of this.listeners.get(event) ?? []) handler(payload);
  }

  flushPendingEvents() {
    const pending = this.pendingEvents;
    this.pendingEvents = [];
    for (const frame of pending) this.send(frame);
  }

  scheduleReconnect() {
    if (this.reconnectTimer || this.manuallyClosed) return;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, this.reconnectDelay);
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
  }
}
