"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_service_1 = __importDefault(require("./user.service"));
const authentication_middleware_1 = require("../../middlewares/authentication.middleware");
const user_authorization_1 = require("./user.authorization");
const token_1 = require("../../utils/security/token");
const router = (0, express_1.Router)();
router.get("/profile", (0, authentication_middleware_1.authentication)(user_authorization_1.endPoint.profile), user_service_1.default.getProfile);
router.post("/logout", (0, authentication_middleware_1.authentication)(user_authorization_1.endPoint.logout), user_service_1.default.logout);
router.post("/refresh-token", (0, authentication_middleware_1.authentication)(user_authorization_1.endPoint.refreshToken, token_1.TokenEnum.REFRESH), user_service_1.default.refreshToken);
exports.default = router;
