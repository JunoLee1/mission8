import { CommentService } from "../service/comment.service.js";
import { NotificationService } from "../service/notification.service.js";
import type { Request, Response, NextFunction } from "express";
import type { CommentDTO, CommentPatchDTO } from "../dto/comment.dto.js";
import prisma from "../lib/prisma.js";
import { Server as HttpServer } from "http";
import { WebsocketService } from "../socket/socket.js";
import { WebSocketServer } from "ws";

export class CommentController {
  private commentService: CommentService; // <- 초기화
  //private notificationService:NotificationService;
  private wss : WebsocketService;
  constructor(server: HttpServer) {
    this.wss = new WebsocketService( server )
    this.commentService = new CommentService(prisma,this.wss); // <- 공용 데이터
    //this.notificationService = new NotificationService(prisma)
   
  }

  async accessCommentList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, take, type } = req.query;
      const commentId = req.query.id;
      let safeType: "MARKET" | "ARTICLE" | undefined = undefined;
      if (type === "MARKET" || type === "ARTICLE") safeType = type;
      const elements = {
        id: Number(commentId),
        page: Number(page ?? 1),
        take: Number(take ?? 10),
        type: safeType ?? "MARKET",
      };
      const result = await this.commentService.accessCommentList(elements);
      res.status(200).json({
        result,
      });
    } catch (error) {
      next(error);
    }
  }

  async accessComment(req: Request, res: Response, next: NextFunction) {
    try {
      const commentId = Number(req.params.id);
      const result = await this.commentService.accessComment(commentId);

      res.status(200).json({
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async createComment(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = Number(req.user?.id);
      if (!userId) throw new Error("unauthorized"); // 401

      const { content, title, name, type, productId, articleId, id } = req.body;
      if (!productId && !articleId)
        throw new Error("productId 또는 articleId 중 하나는 반드시 필요합니다");

      const elements: CommentDTO = {
        type: type === "MARKET" || type === "ARTICLE" ? type : undefined,
        name: String(name ?? ""),
        content: String(content ?? ""),
        title: String(title ?? ""),
        userId,
        productId,
        articleId,
      };
      const nickname = req.user?.nickname;
      if (!nickname) throw new Error("해당 닉네임 존재 하지 않습니다");
      const comment = await this.commentService.createComment(
        nickname,
        elements
      );

      res.status(201).json({
        data: comment,
      });
    } catch (error) {
      next(error);
    }
  }

  async modifyComment(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) throw new Error("unauthorized"); // 401
      const commentId = Number(req.params.id);
      const { content, title } = req.body;
      const elements: CommentPatchDTO = {
        id: commentId,
        content: String(content ?? ""),
        title: String(title ?? ""),
        userId,
      };
      const result = await this.commentService.modifyComment(userId, elements);
      res.status(200).json({
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteComment(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = Number(req.user?.id);
      if (!userId) throw new Error("unauthorized"); // 401
      const commentId = Number(req.params.id);
      const result = await this.commentService.deleteComment(commentId);
      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  }
}
