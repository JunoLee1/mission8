import z from "zod"
const MAX_FILE_SIZE = 5000000;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export const imageUploadSchema = z.object({
  image: z
    .any()
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `업로드 가능한 이미지는 최대 크기는 5mb입니다.`)
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      "Only .jpg, .jpeg, .png and .webp 형태만 업로드 가능 합니다."
    )
})