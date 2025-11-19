import { describe, expect, test, beforeAll, beforeEach, afterEach, it } from '@jest/globals';
import mockData from './product.json' with { type: 'json' };
import mockMethod from './__mock__/prisma.js';
import { ProductService } from '../src/service/product.service.js';
import { PrismaClient } from '@prisma/client';
import { WebsocketService } from '../src/socket/socket.js';
import type { productDTO } from '../src/dto/product.dto.js';
import type { CommentCreateDTO } from '../src/dto/comment.dto.js';
import { Helper } from '../src/helper/helper.js';
import { NotificationService } from '../src/service/notification.service.js';

const helper = new Helper()


let wssMock: Partial<WebsocketService>;

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



describe("ProductService",() => {
    let productService :ProductService;
    let wssMock: Partial<WebsocketService>;
    const prismaMock = mockMethod as any;
    
    helperMock

    beforeEach(() => {
        jest.clearAllMocks()
    })//-> 초기화

    
    beforeAll(async() => {
    wssMock ={
          //broadcast: jest.fn(),
        emitToUser: jest.fn(), // emit도 mock해주는게 안전
    }
    helperMock.findProductById = jest.fn();

    const notificationServiceInstance = new NotificationService(
        prismaMock as PrismaClient,
        wssMock as WebsocketService
    ); 
    
    productService = new ProductService (prismaMock, wssMock as WebsocketService, helperMock as unknown as Helper, notificationServiceInstance);
    }); // -> 초기 데이터 값


    it("access products susccessfully", async() => {
        // debug: confirm mock is set
        const productsArray = [mockData.product1, mockData.product2]

        const query = {take: 10, page: 1, keyword:"test"}
        //  set return value
        mockMethod.product.findMany.mockResolvedValue(productsArray)
        
        //  call service function
        const result = await productService.accessListProduct(query)
        //  validation

        expect(mockMethod.product.findMany).toHaveBeenCalledTimes(1)
        expect(mockMethod.product.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                skip: 0,
                take: 10,
                where: expect.objectContaining({
                OR: [
                    { name: { contains: "test" } },
                    { description: { contains: "test" } },
                 ],
                }),
                include: expect.objectContaining({
                    comment: true,
                    productTags: expect.objectContaining({
                        include: { tag: true },
                    }),
                }),
            }))
        //  debug result
        })

    it("access a product successfully",async() => {
       // debug: confirm mock is set
       const { product1 } = mockData;

       const productMock = {
            ...product1,
            createdAt: new Date(product1.createdAt),
            updatedAt: new Date(product1.updatedAt),
            comment: product1.comment.map(c => ({
                ...c,
                createdAt: new Date(c.createdAt),
                updatedAt: new Date(c.updatedAt)
            }))
        };
       // set return value
        ///mockMethod.product.findUnique.mockResolvedValue(productMock);
        helperMock.findProductById.mockResolvedValue(productMock); // <- 이 한 줄이면 충분
        
        //call service function
        const result = await productService.accessProduct(1)

        // validation
        expect( helperMock.findProductById).toHaveBeenCalledTimes(1)

       // debug result
        expect(result).toEqual(productMock);
    })

    it ("created a product successfully", async() => {
        // set return value
        const userId = 1
        const mockCommentDTO:CommentCreateDTO ={
            id: 1,
            name: "UserNickname",   // 유저 닉네임
            content: "This is a test comment",
            type: "MARKET",
            title: "완전 대박",
            createdAt: new Date("2025-01-25"),
            updatedAt: new Date("2025-01-25"),
            ownerId:userId,
            productId: 1,
            articleId: 0,  
        } as CommentCreateDTO

       const mockProductDTO: productDTO = {
            id:11,
            name: "Test Product2",
            description: "This is a test product",
            price: 1000,
            ownerId:1,
            comment:[mockCommentDTO],
            productTags: [1], // 태그 ID
            productImage:"example.jpg"
        };
        
        mockMethod.user.findUnique.mockResolvedValue({ id: 1 })
        mockMethod.product.create.mockImplementation(async(args) => ({
            ...args.data,
        }))

        //call service function
        const result = await productService.createProduct(1, mockProductDTO)
        
        // validation
        expect(mockMethod.product.create).toHaveBeenCalledTimes(1)
        // debug result
        expect(result).toHaveProperty("name", "Test Product2");
        expect(result).toHaveProperty("ownerId", 1);
    })


    it("updated a product successfully", async()=>{
        // set Mockdata
        const {product1} = mockData;
        const mockProductDTO: productDTO = {
            id:1,
            name: "Test Product2",
            description: "This is a test product",
            price: 10000,
            ownerId:1,
            productTags: [1], // 태그 ID
            productImage:"example.jepg"
        };
        // set return value
        helperMock.findProductById.mockResolvedValue({
            id: 1,
            name: "Old Product",
            description: "Old desc",
            price: 5000,
            ownerId: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        mockMethod.product.update.mockImplementation(async(args) => ({
            ...args.data
        }))

        //call service function
        const result = await productService.modifyProduct(1,mockProductDTO)
        // debug result
        expect(result).toHaveProperty("name","Test Product2")
        expect(result).toHaveProperty("description","This is a test product")
    })
})

