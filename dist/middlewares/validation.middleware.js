"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generalFields = exports.validation = void 0;
const error_response_1 = require("../utils/response/error.response");
const zod_1 = __importDefault(require("zod"));
const validation = (schema) => {
    return (req, res, next) => {
        const validationErrors = [];
        for (const key of Object.keys(schema)) {
            if (!schema[key])
                continue;
            const validationResults = schema[key].safeParse(req[key]);
            if (!validationResults.success) {
                const errors = validationResults.error;
                validationErrors.push({
                    key,
                    issues: errors.issues.map((issue) => {
                        return { message: issue.message, path: issue.path };
                    }),
                });
            }
            if (validationErrors.length > 0) {
                throw new error_response_1.BadRequestException("Validation Error ", { cause: validationErrors });
            }
        }
        return next();
    };
};
exports.validation = validation;
exports.generalFields = {
    username: zod_1.default.string().min(3).max(25),
    email: zod_1.default.email(),
    password: zod_1.default.string(),
    confirmPassword: zod_1.default.string(),
    otp: zod_1.default.string().regex(/^\d{6}/),
};
