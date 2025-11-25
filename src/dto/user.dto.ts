import type { Comment } from "@prisma/client";
import type {Image} from "@prisma/client";
export interface IUserDTO {
  id: number;
  email?: string;
  nickname?: string;
  password?: string;
  createdAt?: Date;
  updatedAt?: Date;
  comment?: Comment[];
  imageUrl: string
}

export interface ChangePasswordDTO {
  newPassword: string;
  currentPassword: string;
}
