import express from "express";
import prisma from"../../lib/prisma.js"
import type { Request, Response, NextFunction } from "express";
import { validateBody } from "../../middleWare/validateMiddle.js";
import { bodySchema } from "../../validation/notification.validation.js";
import { NotificationController } from "../../controller/notification.controller.js";
import { WebsocketService } from "../../socket/socket.js";
import passport from "passport";
import { NotificationService } from "../../service/notification.service.js";

export default function createNotificationAsRead(wss: WebsocketService) {
  const router = express.Router();
  const notificationService = new NotificationService(prisma, wss)
  const notificationController = new NotificationController(notificationService);

  router.patch(
    "/:id",
    passport.authenticate("local", { session: false }),
    validateBody(bodySchema),
    async (req: Request, res: Response, next: NextFunction) => {
      await notificationController.modifyStatus(req, res, next);
    }
  );

  return router;
}
