import { ProductController } from "../../controller/product.controller.js";
import prisma from "../../lib/prisma.js"
import type { Request, Response,  NextFunction} from "express";
import express from "express"
import { Server as HttpServer} from "http";
import { WebsocketService } from "../../socket/socket.js";
import { ProductService } from "../../service/product.service.js";
import { Helper } from "../../helper/helper.js";
import { NotificationService } from "../../service/notification.service.js";


export default function likeRouter (server: HttpServer) {
    const router = express.Router();
    const helper = new Helper();
    const wss = new WebsocketService(server);
    const notificationService = new NotificationService(prisma,wss)
    const productService = new ProductService(prisma, wss, helper,notificationService)
    const productController = new ProductController(productService)
    // 좋아요 요청시 생성
    router.post("/", async(req:Request, res: Response, next: NextFunction) =>{
        await productController.createLike(req, res, next)
    })

    // 좋아요 삭제 api
    router.delete("/:id",async(req:Request, res: Response, next: NextFunction) =>{
        //await productController.deleteLike(req, res, next)
    })
    return router

}