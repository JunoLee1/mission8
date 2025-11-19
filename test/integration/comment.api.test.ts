import prisma from "../../src/lib/prisma.js";
import http from "http";
import request from "supertest";
import commentRouter from "../../src/routes/comment.routes.js";
import type { PrismaClient } from "@prisma/client";
let server: http.Server;
let agent: any;

const prismaMock = {
  user: {
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
  },
  comment:{
    deleteMany: jest.fn().mockResolvedValue({ count: 0 })
  },
  $disconnect: jest.fn().mockResolvedValue(undefined),
  $connect: jest.fn().mockResolvedValue(undefined),
} as unknown as PrismaClient;

beforeAll(async () => {
  await prisma.$connect();

  // 기존 데이터 삭제 (깨끗하게 시작)
  await prismaMock.comment.deleteMany({});
  await prismaMock.user.deleteMany({});
  server = http.createServer();
  agent = request.agent(server);
}); // => 테스트 초기작업
afterAll(async () => {
  await prismaMock.$disconnect();
});

//댓글 생성 테스트
describe("",async () =>{});

