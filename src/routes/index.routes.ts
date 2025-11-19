import express from "express";
import createAuthRouter from "./auth.routes.js";
import userRouter from "./user.routes.js";
import createProductRouter from "./product.routes.js";
import createdArticleRouter from "./article.routes.js";
import createCommentRouter from "./comment.routes.js";
import notificationRouter from "./notification.routes/index.routes.js";
import type { Server as HttpServer } from "http";
import { WebSocketServer } from "ws";



export default function createApiRouter(server: HttpServer) {

  const router = express.Router();
  router.get("/", (req, res) => {
    // API 상태 확인 또는 환영 메시지 전송
    res.status(200).json({ status: "ok", message: "API service is running" });
  });

  router.use("/auth", createAuthRouter(server));
  router.use("/user", userRouter);
  router.use("/product", createProductRouter(server));
  router.use("/article", createdArticleRouter(server));
  router.use("/comment", createCommentRouter(server));
  router.use("/notification", notificationRouter);
  return router;
}
