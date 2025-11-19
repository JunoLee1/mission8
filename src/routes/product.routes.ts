import express from "express";
import type { Request, Response, NextFunction } from "express";
import { ProductController } from "../controller/product.controller.js";
import {
  productIdSchema,
  createProductSchema,
  PatchProductSchema,
  accessListProductSchema,
} from "../validation/product.validation.js";
import {
  validateParam,
  validateBody,
  validateQuery,
} from "../middleWare/validateMiddle.js";
import passport from "passport";
import type { Server as HttpServer } from "http";
import likeRouter from "./like.routes/like.routes.js"
import { ProductService } from "../service/product.service.js";
import { WebsocketService } from "../socket/socket.js";
import { Helper } from "../helper/helper.js";
import { NotificationService } from "../service/notification.service.js";
import prisma from "../lib/prisma.js"

export default function createProductRouter(server: HttpServer) {
  const router = express.Router();
  const wss = new WebsocketService(server)
  const helper  = new Helper();
  const notificationService = new NotificationService(prisma,wss)
  const productService = new ProductService(prisma, wss, helper,notificationService)
  const productController = new ProductController(productService);
  
  // API : 상품 데이터 리스트 조회
  router.get(
    "/",
    validateQuery(accessListProductSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      await productController.accessListProduct(req, res, next);
    }
  );

  // API : 상품 데이터 조회
  router.get(
    "/:id",
    validateParam(productIdSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      await productController.accessProduct(req, res, next);
    }
  );

  // API : 상품 데이터 생성
  router.post(
    "/",
    passport.authenticate("local", { session: false }),
    //upload.single("productImage"),
    validateBody(createProductSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      await productController.createProduct(req, res, next);
    }
  );

  // API : 상품 정보 수정
  router.patch(
    "/:id",
    passport.authenticate("local", { session: false }),
    //upload.single("productImage"),
    validateParam(productIdSchema),
    validateBody(PatchProductSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      await productController.modifyProduct(req, res, next);
    }
  );

  // API : 상품 삭제
  router.delete(
    "/:id",
    passport.authenticate("local", { session: false }),
    async (req: Request, res: Response, next: NextFunction) => {
      await productController.deleteProduct(req, res, next);
    }
  );
  // API :상품 좋아요 생성
   router.use("/:id/likes",likeRouter )
  return router; // router 만 내보내기
}
