import { describe, expect, test, beforeAll, beforeEach, afterEach, it } from '@jest/globals';
import  WS  from "jest-websocket-mock";
import { CommentService } from '../src/service/comment.service.js';
import { ProductService } from '../src/service/product.service.js';
import { NotificationService } from '../src/service/notification.service.js';
import mockMethod from './__mock__/prisma.js';
import mockData from './notification.json' with { type: 'json' };
import { PrismaClient } from '@prisma/client';
import { Helper } from '../src/helper/helper.js';


const helper = new Helper()
const helperMock: {
  findProductById: jest.Mock<
    Promise<{ id: number; name: string; description: string | null; price: number; ownerId: number; createdAt: Date; updatedAt: Date } | null>,
    [number]
  >
} = {
  findProductById: jest.fn(),
};
jest.mock('../src/lib/prisma', () => ({
  __esModule: true,
  default: mockMethod,
}));



describe("notification",() => {
    let productService : ProductService
    let commentService : CommentService
    let notificationService :NotificationService
    let server
     beforeEach(() => {
        jest.clearAllMocks()
    })//-> 초기화

    beforeAll(async()=>{
         // 의존성 주입
        server = new WS("ws://localhost:1234");
        notificationService = new NotificationService(mockMethod as unknown as PrismaClient, server as any)
        productService = new ProductService(mockMethod as unknown as PrismaClient, helperMock, notificationService )
        commentService = new CommentService(mockMethod as unknown as PrismaClient, notificationService )
       
    })
   
    it("댓글 생성시 알림 발생", async()=>{
        // set mockData value
        const {alert1} = mockData;

        //  set return value


        // call the service function
        const result = await commentService()
    })
    it("좋아요 누름시 알림 발생", async()=>{
    // 
    })
    it("좋아요 누른 제품에 가격 변동시 알림 발생",async()=>{})
})