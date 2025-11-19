import type { Request, Response, NextFunction } from "express";
import { ProductService } from "../service/product.service.js";
import type { ProductQueryDTO } from "../dto/product.dto.js";
import { Helper } from "../helper/helper.js";
//import { NotificationService } from "../service/notification.service.js";
import { uploadToS3 } from "../middleWare/upload.js";

const helper = new Helper();
export class ProductController {
  constructor(
    private  productService: ProductService
  ) {}
  async accessListProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const queryParams: ProductQueryDTO =
        req.query as unknown as ProductQueryDTO;
      const result = await this.productService.accessListProduct(queryParams);
      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  async accessProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const idNum = Number(id);
      const result = await this.productService.accessProduct(idNum);
      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      let imageUrl;

      if(req.file){
        imageUrl = await uploadToS3(req.file, "profile")
      }
      if (!imageUrl) throw new Error("image 필수");
      const { name, description, price, ownerId, tags} = req.body as {
        name: string;
        description: string;
        price: number;
        ownerId: number;
        tags?: (number | string)[];
      };
      const user = req.user;
      if (!user) throw new Error("unathorized");
      const userId = user.id;
      if (!userId) throw new Error("unathorized");
      const tagIds = (tags ?? []).map((tag) => Number(tag));
      const result = await this.productService.createProduct(userId, {
        name,
        description,
        price,
        ownerId,
        productTags: tagIds,
        productImage: imageUrl
      });
      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  async modifyProduct(req: Request, res: Response, next: NextFunction) {
    try {
      let imageUrl;
      if(req.file){
         imageUrl = await uploadToS3(req.file, "product")
      }
      if (!imageUrl) throw new Error("image 필수");

      const { id } = req.params; // productId
      const { name, description, price, ownerId, tags, } = req.body as {
        name: string;
        description: string;
        price: number;
        ownerId: number;
        tags?: (number | string)[];
      };

      const user = req.user;
      if (!user) throw new Error("unathorized");
      const userId = user.id;
      if (!userId) throw new Error("unathorized");
      const tagIds = (tags ?? []).map((tag) => Number(tag));
      const result = await this.productService.modifyProduct(userId, {
        id: Number(id),
        name,
        description,
        price,
        ownerId,
        productTags: tagIds,
        productImage:imageUrl,
      });
      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  async deleteProduct(req: Request, res: Response, next: NextFunction) {
    try {
      //const user = req.user;
      //if(!user) throw new Error("unathorized");
      const { id } = req.params;
      const productId = Number(id);

      const userId = Number(req.user?.id);
      if (!userId) throw new Error("unathorized");

      const result = await this.productService.deleteProduct(productId, userId);
      return res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  }
  async createLike(req: Request, res: Response, next: NextFunction) {
    // 해당 유저가 있는가 ?
    // 해당 제품이 존재하는가 ?
    // 해당 유저가 이미 좋아요를 눌렀는가?
    const {receiverId} = req.body;
    const userId = req.user?.id; // 좋아요를 누른 사람
    const productId = Number(req.params.id);
    const numReceiverId = Number(receiverId)

    if(!userId) throw new Error(" 존재하지않는 유저 입니다")// 401
    if (typeof numReceiverId !== "number") throw new Error("게시글 주인의 인덱스는 숫자이어야합니다")
    if (userId === numReceiverId) throw new Error("전송자 에러") // 401 ?? 403
    if (typeof productId !== "number") throw new Error(" 해당 제품의 인덱스는 숫자이어야합니다")
    
    
    const result = await this.productService.createLike(userId, productId)
    return res.status(201).json({
      data: result,
      message: "좋아요를 눌렀습니다"
    })
  }
  async deleteLike(req: Request, res: Response, next: NextFunction){
    // 해당 유저가 존재하는가?
    // 해당 제품이 존재하는가?
    // 해당 제품이 성공적으로 삭제되어졌는가?
    const userId = req.user?.id; // 좋아요를 누른 사람
    const {receiverId} = req.body;
    const productId = Number(req.params.id)
    const numReceiverId = Number(receiverId)

    if(!userId) throw new Error(" 존재하지않는 유저 입니다")// 401
    if (typeof productId !== "number") throw new Error(" 해당 제품의 인덱스는 숫자이어야합니다")
    if (typeof numReceiverId !== "number") throw new Error("게시글 주인의 인덱스는 숫자이어야합니다")
    if (userId === numReceiverId) throw new Error("전송자 에러") // 401 ?? 403
    
    await this.productService.deleteLike(userId, productId)

    return res.status(201).json({
      message:"성공적으로 좋아요 취소 되었습니다."
    })
  }
}
