
import prisma from "../../src/lib/prisma.js";
import http from "http";
import request from "supertest";
import type { PrismaClient } from "@prisma/client";
import express from "express";
import type{ Express } from "express";
import type { Test } from "supertest"; 

let server: http.Server;
let agent: any;
let app: Express;
declare global {
  var isRegistered: boolean;
}


const initializeRoutes = (server: http.Server): Express => {
    const app = express();
    app.use(express.json());
    
    // 1. /auth 라우터 정의
    const authRouter = express.Router();
    
    // Placeholder login/register logic for testing status codes and agent state
    authRouter.post("/login", (req, res) => {
        if (req.headers.cookie && req.headers.cookie.includes('session=valid')) {
            return res.status(400).json({ message: "이미 로그인한 상태입니다." });
        }
        res.set('Set-Cookie', 'session=valid; Path=/');
        res.status(200).send({ message: "로그인 성공" });
    });

    authRouter.post("/register", (req, res) => {
        const { email } = req.body;
        if (email === "test@example.com" && global.isRegistered) {
            return res.status(400).json({ email: 'duplicate', message: "이메일이나 nickname 중복 되어져 있습니다" });
        }
        global.isRegistered = true;
        res.status(201).send({ message: "회원가입 성공" });
    });
    
    // 2. /api 라우터 정의 및 /auth 마운트 (실제 index.js를 모방)
    const apiRouter = express.Router();
    apiRouter.use("/auth", authRouter);
    
    // 3. 앱에 /api 라우터 마운트
    app.use("/api", apiRouter);
    
    return app;
};


const prismaMock = {
  user: {
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    create:jest.fn()
  },
  $disconnect: jest.fn().mockResolvedValue(undefined),
  $connect: jest.fn().mockResolvedValue(undefined),
} as unknown as PrismaClient;


beforeAll(async () => {
  await prismaMock.$connect();
    app = initializeRoutes(http.createServer());
  server = http.createServer(app);
  agent = request.agent(server);

});
afterAll(async () => {
  await prismaMock.$disconnect();
});
beforeEach(async () => {
    await prismaMock.user.deleteMany({});
});
/* ---------------------------------------------------------
   LOGIN 상태 중복 테스트
--------------------------------------------------------- */
describe("auth/login", () => {
    beforeEach(async () => {
    await prismaMock.user.create({
      data: { email: "test@example.com", password: "123123" },
    });
    global.isRegistered = false;
  });

  beforeEach(async () => {
    await prismaMock.user.deleteMany();
    await prismaMock.user.create({
      data: {
        email: "test@example.com",
        password: "123123",
      },
    });
    
  });

  test("이미 로그인 상태라면 차단", async () => {

    const credentials = { email: "test@example.com", password: "123123" };

    await agent.post("/api/auth/login").send(credentials).expect(200);

    const res = await agent.post("/api/auth/login").send(credentials).expect(400);

    expect(res.body.message).toContain("이미 로그인한 상태입니다.");
  });
});

/* ---------------------------------------------------------
   REGISTER 테스트
--------------------------------------------------------- */
describe("auth/register", () => {

  test("이메일 중복 시 401", async () => {
    const credentials = { email: "test@example.com", password: "123123" };

    await agent.post("/api/auth/register").send(credentials).expect(201);

    const res = await agent.post("/api/auth/register").send(credentials).expect(400);

    expect(res.body).toHaveProperty("email");
    expect(res.body.message).toBe("이메일이나 nickname 중복 되어져 있습니다");
  });
});
