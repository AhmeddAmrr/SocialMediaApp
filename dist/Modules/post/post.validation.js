"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePostSchema = exports.likeUnlikePostSchema = exports.createPostSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const post_model_1 = require("../../DB/models/post.model");
const validation_middleware_1 = require("../../middlewares/validation.middleware");
const cloud_multer_1 = require("../../utils/multer/cloud.multer");
exports.createPostSchema = {
    body: zod_1.default.strictObject({
        content: zod_1.default.string().min(2).max(50000).optional(),
        attachments: zod_1.default.array(validation_middleware_1.generalFields.file(cloud_multer_1.fileValidation.image)).max(3).optional(),
        allowComments: zod_1.default.enum(post_model_1.AllowCommentsEnum).default(post_model_1.AllowCommentsEnum.ALLOW),
        availability: zod_1.default.enum(post_model_1.AvailabilityEnum).default(post_model_1.AvailabilityEnum.PUBLIC),
        tags: zod_1.default.array(validation_middleware_1.generalFields.id).max(10).optional(),
    }).superRefine((data, ctx) => {
        if (!data.attachments?.length && !data.content) {
            ctx.addIssue({
                code: "custom",
                path: ["content"],
                message: "Please provide content or attachments"
            });
        }
        if (data.tags?.length
            && data.tags.length !== [...new Set(data.tags)].length) {
            ctx.addIssue({
                code: "custom",
                path: ["tags"],
                message: "please provide unique tags",
            });
        }
    })
};
exports.likeUnlikePostSchema = {
    params: zod_1.default.strictObject({
        postId: validation_middleware_1.generalFields.id,
    }),
    query: zod_1.default.strictObject({
        action: zod_1.default.enum(post_model_1.ActionEnum).default(post_model_1.ActionEnum.LIKE)
    })
};
exports.updatePostSchema = {
    params: zod_1.default.strictObject({
        postId: validation_middleware_1.generalFields.id,
    }),
    body: zod_1.default.strictObject({
        content: zod_1.default.string().min(2).max(50000).optional(),
        attachments: zod_1.default.array(validation_middleware_1.generalFields.file(cloud_multer_1.fileValidation.image)).max(3).optional(),
        allowComments: zod_1.default.enum(post_model_1.AllowCommentsEnum).default(post_model_1.AllowCommentsEnum.ALLOW),
        availability: zod_1.default.enum(post_model_1.AvailabilityEnum).default(post_model_1.AvailabilityEnum.PUBLIC),
        tags: zod_1.default.array(validation_middleware_1.generalFields.id).max(10).optional(),
        removedTags: zod_1.default.array(validation_middleware_1.generalFields.id).max(10).optional(),
        removedAttachments: zod_1.default.array(zod_1.default.string()).max(10).optional(),
    }).superRefine((data, ctx) => {
        if (!data.attachments?.length && !data.content) {
            ctx.addIssue({
                code: "custom",
                path: ["content"],
                message: "Please provide content or attachments"
            });
        }
        if (data.tags?.length
            && data.tags.length !== [...new Set(data.tags)].length) {
            ctx.addIssue({
                code: "custom",
                path: ["tags"],
                message: "please provide unique tags",
            });
        }
        if (data.removedTags?.length
            && data.removedTags.length !== [...new Set(data.removedTags)].length) {
            ctx.addIssue({
                code: "custom",
                path: ["removedTags"],
                message: "please provide unique removedTags",
            });
        }
    })
};
