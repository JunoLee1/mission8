import {WS} from "jest-websocket-mock";
import WebSocket from "ws"; 

// create a WS instance, listening on port 1234 on localhost
const server = new WS("ws://localhost:1234", { jsonProtocol: true });

// real clients can connect
const client = new WebSocket("ws://localhost:1234");
await server.connected; // wait for the server to have established the connection

// the mock websocket server will record all the messages it receives
client.send("hello");

// the mock websocket server can also send messages to all connected clients
server.send("hello everyone");

// ...simulate an error and close the connection
server.error();

// ...or gracefully close the connection
server.close();

// The WS class also has a static "clean" method to gracefully close all open connections,
// particularly useful to reset the environment between test runs.
WS.clean();