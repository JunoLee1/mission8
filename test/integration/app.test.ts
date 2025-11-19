import http from "http";
import request from "supertest";
import initializedRoutes from "../../src/index.js"
import prisma from "../../src/lib/prisma.js";
import express from "express";
import { createServer } from "../../src/server.js";
import createApiRouter from "../../src/routes/index.routes.js";
import type { PrismaClient } from "@prisma/client";


let server: http.Server;
let app: express.Express;
const prismaMock = {
  
  $disconnect: jest.fn().mockResolvedValue(undefined),
  $connect: jest.fn().mockResolvedValue(undefined),
} as unknown as PrismaClient;


beforeAll(async () => {
    server = http.createServer();
    await prismaMock.$connect();
});
afterAll(async () => {
  await prismaMock.$disconnect();
});

 beforeEach(() => {
    // 테스트용 서버 생성
    app = express();
    app.use(express.json());
    app.use("/api", createApiRouter(server))

    // initializedRoutes에 server 전달하여 라우트 생성
    // 필요하면 실제 서버 실행, 아니면 Supertest에 app만 넘겨도 됨
    
    //request(app).get("/api") // OK
  });

  
describe("메인 라우트 실행", () => {

  test("메인 GET /api 요청", async () => {
    const res = await request(app).get("/api");
   expect(res.status).toBe(200);
  });
});


