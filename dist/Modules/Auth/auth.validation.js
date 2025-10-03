"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signUpSchema = exports.confirmEmailSchema = exports.loginSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const validation_middleware_1 = require("../../middlewares/validation.middleware");
exports.loginSchema = {
    body: zod_1.default.strictObject({
        email: validation_middleware_1.generalFields.email,
        password: validation_middleware_1.generalFields.password,
    })
};
exports.confirmEmailSchema = {
    body: zod_1.default.strictObject({
        email: validation_middleware_1.generalFields.email,
        otp: validation_middleware_1.generalFields.otp,
    })
};
exports.signUpSchema = {
    body: exports.loginSchema.body.extend({
        username: validation_middleware_1.generalFields.username,
        confirmPassword: validation_middleware_1.generalFields.confirmPassword,
    }).superRefine((data, ctx) => {
        if (data.password !== data.confirmPassword) {
            ctx.addIssue({
                code: "custom",
                path: ["confirmPassword"],
                message: "password Mismatch"
            });
        }
    }),
};
