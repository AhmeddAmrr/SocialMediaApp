"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.acceptFriendRequestSchema = exports.sendFriendRequestSchema = exports.logOutSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const token_1 = require("../../utils/security/token");
const validation_middleware_1 = require("../../middlewares/validation.middleware");
exports.logOutSchema = {
    body: zod_1.default.strictObject({
        flag: zod_1.default.enum(token_1.logoutEnum).default(token_1.logoutEnum.only),
    }),
};
exports.sendFriendRequestSchema = {
    params: zod_1.default.strictObject({
        userId: validation_middleware_1.generalFields.id,
    }),
};
exports.acceptFriendRequestSchema = {
    params: zod_1.default.strictObject({
        requestId: validation_middleware_1.generalFields.id,
    }),
};
