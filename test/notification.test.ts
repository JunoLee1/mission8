import { describe, expect, beforeAll, beforeEach, it } from '@jest/globals';
import { CommentService } from '../src/service/comment.service.js';
import { ProductService } from '../src/service/product.service.js';
import { NotificationService } from '../src/service/notification.service.js';
import mockProductData from './product.json' with { type: 'json' };
import mockData from './notification.json' with { type: 'json' };
import { PrismaClient } from '@prisma/client';
import { Helper } from '../src/helper/helper.js';
import { WebsocketService } from '../src/socket/socket.js';
import { WebSocketServer } from 'ws';
import mockMethod from './__mock__/prisma.js';


jest.mock('../src/lib/prisma', () => {
  const mockMethod = require('./__mock__/prisma.js').default; // 동적으로 require
  return {
    __esModule: true,
    default: mockMethod,
  };
});

const mockNotificationService = {
  createAndGenerate: jest.fn().mockImplementation((senderId, receiverId, title, type, category, content) => {
    wssMock.emitToUser(receiverId, "notification", { type, message: content });
    return { payload: { senderId, receiverId, title, type, category } };
  })
};
// ✅ Helper mock 설정
const helperMock = {
  findProductById: jest.fn<Promise<{ id: number; name: string; description: string | null; price: number; ownerId: number; createdAt: Date; updatedAt: Date } | null>, [number]>(),
};

// ✅ Prisma mock

//  product 관련 mock 

const wssMock = { broadcast: jest.fn(), emitToUser: jest.fn(), };
describe("NotificationService Integration", () => {
  let productService: ProductService;
  let commentService: CommentService;
  let notificationService: NotificationService;
  let wssMock: WebsocketService;
  beforeEach(() => {
    jest.clearAllMocks();
  });

  beforeAll(() => {
    // ✅ WebSocketService mock
    wssMock = {
        emitToUser: jest.fn(),
        setupWebsocket: jest.fn(),
        userSocketMap: new Map<number, any>(),
        handleClientMessage: jest.fn(),
        wss: {
            clients: new Set(), // 필요할 때만
            on: jest.fn(),
            close: jest.fn(),
        }as unknown as WebSocketServer
    } as unknown as WebsocketService

    // ✅ 서비스 초기화
    notificationService = new NotificationService(
      mockMethod as unknown as PrismaClient,
      wssMock
    );
    productService = new ProductService(
      mockMethod as unknown as PrismaClient,
      wssMock,
      helperMock as unknown as Helper,
      mockNotificationService as unknown as NotificationService
    );
    commentService = new CommentService(
      mockMethod as unknown as PrismaClient,
      wssMock
    );
  });

  it("알림 생성 및 전송 테스트", async () => {
    const {alert1} = mockData;

    // 🔹 가짜 알림 생성 mock 설정
    mockMethod.notification.create.mockResolvedValue(alert1);
    
    // 🔹 알림 서비스 mock 동작
    wssMock.emitToUser = jest.fn();
    // 🔹 notificationService의 createAndGenerate 메서드 호출
    const result = await notificationService.createAndGenerate(
        1, // senderId
        2, // receiverId
        "새 댓글 알림", // title
        "UNREAD", // type
        "NEW_COMMENT", // category          
        1, // productId
        1, // articleId
        "사용자1이 당신의 제품에 댓글을 남겼습니다.", // content
        undefined, // oldPrice
        undefined  // newPrice
    );
    
    // 🔹 emitToUser 호출 검증
    expect(wssMock.emitToUser).toHaveBeenCalledWith(
        2,
        "notification",
        expect.objectContaining({
            type: "NEW_COMMENT",
            message: "사용자1이 당신의 제품에 댓글을 남겼습니다.",
        })
    );

    // 🔹 결과 검증
    expect(result).toHaveProperty("payload");
    expect(result.payload).toHaveProperty("type", "NEW_COMMENT");
  });
  
  /// 좋아요를 누른 제품의 가격이 변동있는 경우 알림전송
  it("댓글 생성 시 알림 발생", async () => {
    const { alert1 } = mockData;

    // 🔹 가짜 댓글 생성 mock 설정
    mockMethod.comment.create.mockResolvedValue(alert1);

    // 🔹 알림 서비스 mock 동작
    wssMock.emitToUser = jest.fn();

    // 🔹 commentService의 create 메서드 호출 
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

  it("modifyProduct: 좋아요를 누른  사용자에게만 있는 제품 가격이 변동되면 알림을 전송한다", async () => {
    
    // debug: confirm mock is set
    const { product1 } = mockProductData;

    // 제품 조회 mock 설정
    mockMethod.product.findUnique.mockResolvedValue(product1);

    // 유저가 좋아요를 누른 제품 mock 설정
    mockMethod.like.findMany.mockResolvedValue([
      { id: 1, userId: 2, productId: 1 },
      { id: 2, userId: 3, productId: 1 },
    ]);
    
    productService.mockNotificationService.createAndGenerate = jest.fn().mockImplementation((senderId, receiverId, title, type, category, content, productId, articleId, oldPrice, newPrice) => ({
      payload: { senderId, receiverId, title, type, category, oldPrice, newPrice },
    }));

    // 제품 가격 변경 알림 호출
   notificationService.emitToUser(1,{
      type: "CHANGED_PRICE",
      productId: 1,
      userId: 1,
      message: `상품 가격이 1000 → 1200로 변경되었습니다.`,
    } );

    // set return value

    // debug result
  
    mockMethod.product.update.mockResolvedValue({id :1 });
    wssMock.broadcast = jest.fn();
    
    expect(wssMock.broadcast).toHaveBeenCalled();
  });
});
