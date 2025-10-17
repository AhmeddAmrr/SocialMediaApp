import z from "zod"
import { likeUnlikePostSchema } from "./post.validation"

export type LikePostQueryDTO = z.infer<typeof likeUnlikePostSchema.query>