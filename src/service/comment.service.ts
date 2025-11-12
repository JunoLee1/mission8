import { PrismaClient } from "@prisma/client";
import prisma from "../lib/prisma.js";
import type {
  CommentQueryDTO,
  CommentDTO,
  CommentPatchDTO,
} from "../dto/comment.dto.js";
import { Helper } from "../helper/helper.js";
import { NotificationService } from "./notification.service.js";
import { emitToUser } from "../server.js";
import type { WebsocketService } from "../socket/socket.js";
import { WebSocketServer } from "ws";

const helper = new Helper();
export class CommentService {
  private prisma: PrismaClient; // ← 필드 선언
  private notificationService: NotificationService;
  private wss: WebSocketServer;
  constructor(prisma: PrismaClient, wss: WebSocketServer) {
    this.prisma = prisma; // <-  생성자에서 필드 초기화
    this.wss = wss
    this.notificationService = new NotificationService(prisma, this.wss);
  }

  async accessCommentList(elements: CommentQueryDTO) {
    const { id, page, take, type } = elements;
    const skip = (page - 1) * take;
    const commentId = Number(id);
    const whereCondition = // 검색 조건
      type === "MARKET" ? { productId: commentId } : { articleId: commentId };

    const result = await this.prisma.comment.findMany({
      where: whereCondition,
      skip,
      take,
    });
    return result;
  }

  async accessComment(commentId: number) {
    const comment = await helper.findCommentById(commentId);
    if (!comment) throw new Error("해당 댓글이 존재 하지 않습니다"); // 404

    return comment;
  }

  async createComment(nickname: string, elements: CommentDTO) {
    const { content, title, name, type, productId, articleId, userId} = elements;
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      select: { ownerId: true, title: true },
    });
    if (!article) throw new Error("해당 게시글이 존재하지 않습니다");
    const connectData =
      type === "MARKET"
        ? { connect: { id: productId } }
        : { connect: { id: articleId } };
    const result = await this.prisma.comment.create({
      data: {
        content,
        title,
        ...connectData
      },
    });

    if (article.ownerId !== userId) {
      const { notification, payload } =
        await this.notificationService.createAndGenerate(
          userId,
          article.ownerId,
          `${nickname}님이 댓글을 남겼습니다.`,
          "UNREAD",
          "NEW_COMMENT",
          articleId
        );
      emitToUser(article.ownerId, "NEW_COMMENT", {
        type: "NEW_COMMENT",
        payload,
      });
    }
    return result;
  }

  async modifyComment(userId: Number, elements: CommentPatchDTO) {
    const { id, content, title } = elements;
    const commentId = id;

    const comment = await helper.findCommentById(commentId);
    if (!comment) throw new Error("해당 댓글이 없습니다"); //404

    const element = {
      content: elements.content ?? "",
      title: elements.title ?? "",
    };
    const result = await this.prisma.comment.update({
      where: { id: commentId },
      data: {
        ...element,
      },
    });
    return result;
  }

  async deleteComment(commentId: number) {
    const comment = await helper.findCommentById(commentId);
    if (!comment) throw new Error("해당 댓글이 없습니다"); // 404

    const result = await this.prisma.comment.delete({
      where: { id: commentId },
    });
    return result;
  }
}
