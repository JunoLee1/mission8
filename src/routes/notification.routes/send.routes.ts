import express from "express";
import type { Request, Response, NextFunction } from "express";
import { NotificationController } from "../../controller/notification.controller.js";
import { validateBody } from "../../middleWare/validateMiddle.js";
import { bodySchema } from "../../validation/notification.validation.js";
import passport from "passport";
import { WebsocketService } from "../../socket/socket.js";
import { NotificationService } from "../../service/notification.service.js";
import prisma from"../../lib/prisma.js"


export default function createNotificationSend(wss: WebsocketService) {
  const router = express.Router();
  const notificationService = new NotificationService(prisma,wss)
  const notificationController = new NotificationController(notificationService);

  // 알림 전송
  router.post(
    "/",
    passport.authenticate("local", { session: false }),
    validateBody(bodySchema),
    async (req: Request, res: Response, next: NextFunction) => {
      return notificationController.alertSend(req, res, next);
    }
  );
  
  return router;
}
