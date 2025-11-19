import prisma from "../lib/prisma.js";
import type { ProductQueryDTO, productDTO } from "../dto/product.dto.js";
import { Helper } from "../helper/helper.js";
import { NotificationService } from "./notification.service.js";
import { emitToUser } from "../server.js";
import type { WebsocketService } from "../socket/socket.js";
import type { PrismaClient } from "@prisma/client/extension";

export class ProductService {
  constructor(
    private prisma: PrismaClient,
    private wss: WebsocketService,
    public helper: Helper, // 혹은 public
    private notificationService: NotificationService
  ) {}
  async accessListProduct(query: ProductQueryDTO) {
    const { page, take, name, description, keyword } = query;
    const skip = (page - 1) * take;
    const whereCondition = keyword
      ? {
          OR: [
            { name: { contains: keyword } },
            { description: { contains: keyword } },
          ],
        }
      : {};

    const products = await prisma.product.findMany({
      skip,
      take,
      where: whereCondition,
      include: {
        productTags: {
          include: {
            tag: true,
          },
        },
        comment: true,
      },
    });

    const result = products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      ownerId: p.ownerId,
      productTags: p.productTags.map((pt) => pt.tag.id),
      comments: p.comment.map((c) => ({
        id: c.id,
        userId: c.userId,
        content: c.content,
      })),
    }));
    return result;
  }

  async accessProduct(id: number) {
    const result = await this.helper.findProductById(id);
    
    if (!result) throw new Error("해당 아이템이 존재 하지않습니다.");
    return result;
  }

  async createProduct(userId: number, element: productDTO) {
    const { name, description, price, ownerId, productTags } = element;

    const data: any = {
      name,
      description,
      price,
      ownerId: userId,
    };

    if (!productTags || productTags.length === 0) {
      throw new Error("product tags are required");
    }
    data.productTags = {
      create: productTags.map((tagId) => ({
        tag: { connect: { id: tagId } }, // 단순 tagId 연결
      })),
    };
    const productData = await prisma.product.create({
      data,
    });
    return productData;
  }

  async modifyProduct(userId: number, element: productDTO) {
    const { id, name, description, price, ownerId, productTags } = element;

    const idNum = Number(id);
    if (!idNum) throw new Error("product id is required");
    const product = await this.helper.findProductById(idNum);
    if (!product) throw new Error("해당 제품은 존재 하지않습니다");

    if (product.ownerId !== userId) {
      throw new Error("Unathorized");
    }

    const data: any = {
      name: name ?? product.name,
      description: description ?? product.description,
      price: price ?? product.price,
      ownerId: userId,
      productTags: productTags?.length
        ? {
            create: productTags.map((tagId) => ({
              tag: { connect: { id: tagId } },
            })),
          }
        : undefined,
    };
    const updated = await prisma.product.update({
      where: { id: idNum },
      data,
    });
    if (product.price !== updated.price) {
      const likers =
        (await prisma.like.findMany({
          where: { productId: updated.id },
          select: { userId: true },
        })) || [];

      for (const liker of likers) {
        if (liker.userId !== userId) {
          // 상품 올린사람이 아닌 경우
          const { payload } = await this.notificationService.createAndGenerate(
            userId,
            liker.userId,
            `가격 변경 알림`,
            "UNREAD",
            "CHANGED_PRICE",
            undefined,
            updated.id,
            undefined,
            product.price,
            updated.price
          );
          emitToUser(liker.userId, "CHANGED_PRICE", payload);
        }
      }
    }
    return updated;
  }

  async deleteProduct(id: number, userId: number) {
    const product = await this.helper.findProductById(id);
    if (!product) throw new Error("해당 제품은 존재 하지않습니다.");

    if (product.ownerId !== userId) {
      throw new Error("Unathorized");
    }
    const result = await prisma.product.delete({
      where: { id },
    });
    return result;
  }

  async createLike(userId: number, productId: number) {
    const product = await this.helper.findProductById(productId);
    const uniqueLike = await this.validateLike(userId, productId);
    if (uniqueLike) throw new Error("이미 좋아요를 누른 상태 입니다");

    const newLike = await this.prisma.like.create({
      data:{
        userId,
        productId
      }
    })
    return newLike;
  }
  async deleteLike(userId: number, productId: number){
    const product = await this.helper.findProductById(productId);
    const uniqueLike = await this.validateLike(userId, productId);
    if (!uniqueLike) throw new Error("이미 좋아요를 누른 상태 입니다");

    const removeLike = await this.prisma.like.delete({
      where:{id:uniqueLike.id}
    })
    return removeLike;
  }

  async validateLike(userId: number, productId: number) {
    const result = await this.prisma.like.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        }, // 해당유저가 이미 좋아요를 누른 상태라면?
      },
    });
    return result;
  }

}
