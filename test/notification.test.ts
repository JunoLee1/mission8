import { describe, expect, beforeAll, beforeEach, it } from '@jest/globals';
import { CommentService } from '../src/service/comment.service.js';
import { ProductService } from '../src/service/product.service.js';
import { NotificationService } from '../src/service/notification.service.js';
import mockProductData from './product.json' with { type: 'json' };
//import mockCommentData from './comment.json' with { type: 'json' };
import mockMethod from './__mock__/prisma.js';
import mockData from './notification.json' with { type: 'json' };
import { PrismaClient } from '@prisma/client';
import { Helper } from '../src/helper/helper.js';
import { WebsocketService } from '../src/socket/socket.js';
import type { WebSocketServer } from 'ws';

// ✅ Helper mock 설정
const helperMock = {
  findProductById: jest.fn<Promise<{ id: number; name: string; description: string | null; price: number; ownerId: number; createdAt: Date; updatedAt: Date } | null>, [number]>(),
};

// ✅ Prisma mock
jest.mock('../src/lib/prisma', () => ({
  __esModule: true,
  default: mockMethod,
}));

describe("NotificationService Integration", () => {
  let productService: ProductService;
  let commentService: CommentService;
  let notificationService: NotificationService;
  let wssMock: Partial<WebsocketService> ;
  beforeEach(() => {
    jest.clearAllMocks();
  });

  beforeAll(() => {
    // ✅ WebSocketService mock
    wssMock = {
      broadcast: jest.fn(),
      //emitToUser: jest.fn(),
    } 

    // ✅ 서비스 초기화
    notificationService = new NotificationService(
      mockMethod as unknown as PrismaClient,
      wssMock
    );
    productService = new ProductService(
      mockMethod as unknown as PrismaClient,
      wssMock,
      helperMock as unknown as Helper
    );
    commentService = new CommentService(
      mockMethod as unknown as PrismaClient,
      wssMock
    );
  });

  it("댓글 생성 시 알림 발생", async () => {
    const { alert1 } = mockData;

    // 🔹 가짜 댓글 생성 mock 설정
    mockMethod.comment.create.mockResolvedValue(alert1);

    // 🔹 알림 서비스 mock 동작
    wssMock.broadcast = jest.fn();

    // 🔹 commentService의 create 메서드 호출 (예시)
    const result = await commentService.createComment("juno", {
        name: "테스터",
        articleId: 1,   
        content: "테스트 댓글",
        productId:0,
        userId: 1,
        type: "MARKET",
        title: "테스트 제목",
    });

    // 🔹 broadcast 호출 검증
    expect(wssMock.broadcast).toHaveBeenCalledTimes(1);
    expect(result).toHaveProperty("content", "테스트 댓글");
  });

  it("좋아요 시 알림 발생", async () => {
    mockMethod.like.create.mockResolvedValue({ id: 1, userId: 1, productId: 1 });
    wssMock.broadcast = jest.fn();

    //await notificationService.notifyLike(1, 1); // 가정: 이런 메서드가 존재

    expect(wssMock.broadcast).toHaveBeenCalled();
  });

  it("좋아요 제품 가격 변동 시 알림 발생", async () => {
    const { product1 } = mockProductData;
    mockMethod.product.update.mockResolvedValue({
      ...product1,
      price: 999,
    });
    wssMock.broadcast = jest.fn();

    await productService.modifyProduct(1, {
        id: product1.id,
      name: product1.name,
      description: product1.description || "",
      price: 999,
      ownerId: product1.ownerId,
      productTags: [],
      userId:1,
      comment,
      createdAt: product1.createdAt,
      updatedAt: product1.updatedAt,
        
    });

    expect(wssMock.broadcast).toHaveBeenCalled();
  });
});
