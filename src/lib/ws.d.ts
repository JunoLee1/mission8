import type { WebSocketServer } from "ws";

declare module "ws" {
  class _WS extends WebSocket { }
  export interface WebSocket {
      online: boolean;
      Server: WebSocketServer;
      broadcast
  }
}
