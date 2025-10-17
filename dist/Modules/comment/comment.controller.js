"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const comment_service_1 = __importDefault(require("./comment.service"));
const authentication_middleware_1 = require("../../middlewares/authentication.middleware");
const token_1 = require("../../utils/security/token");
const comment_authorization_1 = require("./comment.authorization");
const validation_middleware_1 = require("../../middlewares/validation.middleware");
const vallidators = __importStar(require("./comment.validation"));
const cloud_multer_1 = require("../../utils/multer/cloud.multer");
const router = (0, express_1.Router)({
    mergeParams: true,
});
router.post("/", (0, authentication_middleware_1.authentication)(comment_authorization_1.endPoint.createComment, token_1.TokenEnum.ACCESS), (0, cloud_multer_1.cloudFileUpload)({ validation: cloud_multer_1.fileValidation.image }).array("attachments", 3), (0, validation_middleware_1.validation)(vallidators.createCommentSchema), comment_service_1.default.createComment);
router.post("/:commentId/reply", (0, authentication_middleware_1.authentication)(comment_authorization_1.endPoint.createReply, token_1.TokenEnum.ACCESS), (0, cloud_multer_1.cloudFileUpload)({ validation: cloud_multer_1.fileValidation.image }).array("attachments", 3), (0, validation_middleware_1.validation)(vallidators.createReplySchema), comment_service_1.default.createReply);
exports.default = router;
