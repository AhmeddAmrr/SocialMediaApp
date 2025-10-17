import z from "zod"
import { ActionEnum, AllowCommentsEnum, AvailabilityEnum } from "../../DB/models/post.model"
import { generalFields } from "../../middlewares/validation.middleware"
import { fileValidation } from "../../utils/multer/cloud.multer"


export const createPostSchema = {

    body: z.strictObject({
        content: z.string().min(2).max(50000).optional(),
        attachments: z.array(generalFields.file(fileValidation.image)).max(3).optional(),
        allowComments: z.enum(AllowCommentsEnum).default(AllowCommentsEnum.ALLOW),
        availability: z.enum(AvailabilityEnum).default(AvailabilityEnum.PUBLIC),
        tags: z.array(generalFields.id).max(10).optional(),

    }).superRefine((data, ctx) => {
        if (!data.attachments?.length && !data.content) {
            ctx.addIssue({
                code: "custom",
                path: ["content"],
                message: "Please provide content or attachments"
            })
        }
        if (
            data.tags?.length
            && data.tags.length !== [...new Set(data.tags)].length
        ) {
            ctx.addIssue({
                code: "custom",
                path: ["tags"],
                message: "please provide unique tags",
            })
        }
    })
}

export const likeUnlikePostSchema = {

    params: z.strictObject({
       postId: generalFields.id,


    }),
    query : z.strictObject({
        action: z.enum(ActionEnum).default(ActionEnum.LIKE)
    })
}
export const updatePostSchema = {

    params: z.strictObject({
        postId: generalFields.id,
    }),
    body: z.strictObject({
        content: z.string().min(2).max(50000).optional(),
        attachments: z.array(generalFields.file(fileValidation.image)).max(3).optional(),
        allowComments: z.enum(AllowCommentsEnum).default(AllowCommentsEnum.ALLOW),
        availability: z.enum(AvailabilityEnum).default(AvailabilityEnum.PUBLIC),
        tags: z.array(generalFields.id).max(10).optional(),
        removedTags: z.array(generalFields.id).max(10).optional(),
        removedAttachments: z.array(z.string()).max(10).optional(),

    }).superRefine((data, ctx) => {
        if (!data.attachments?.length && !data.content) {
            ctx.addIssue({
                code: "custom",
                path: ["content"],
                message: "Please provide content or attachments"
            })
        }
        if (
            data.tags?.length
            && data.tags.length !== [...new Set(data.tags)].length
        ) {
            ctx.addIssue({
                code: "custom",
                path: ["tags"],
                message: "please provide unique tags",
            })
        }
         if (
            data.removedTags?.length
            && data.removedTags.length !== [...new Set(data.removedTags)].length
        ) {
            ctx.addIssue({
                code: "custom",
                path: ["removedTags"],
                message: "please provide unique removedTags",
            })
        }
    })
}