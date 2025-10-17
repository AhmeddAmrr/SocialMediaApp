"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReplySchema = exports.createCommentSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const validation_middleware_1 = require("../../middlewares/validation.middleware");
const cloud_multer_1 = require("../../utils/multer/cloud.multer");
exports.createCommentSchema = {
    params: zod_1.default.strictObject({
        postId: validation_middleware_1.generalFields.id,
    }),
    body: zod_1.default.strictObject({
        content: zod_1.default.string().min(2).max(50000).optional(),
        attachments: zod_1.default.array(validation_middleware_1.generalFields.file(cloud_multer_1.fileValidation.image)).max(3).optional(),
        tags: zod_1.default.array(validation_middleware_1.generalFields.id).max(10).optional(),
    }).superRefine((data, ctx) => {
        if (!data.attachments?.length && !data.content) {
            ctx.addIssue({
                code: "custom",
                path: ["content"],
                message: "please provide content or attachment "
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
exports.createReplySchema = {
    params: exports.createCommentSchema.params.extend({
        commentId: validation_middleware_1.generalFields.id
    }),
    body: exports.createCommentSchema.body,
};
