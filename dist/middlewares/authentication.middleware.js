"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authentication = void 0;
const error_response_1 = require("../utils/response/error.response");
const token_1 = require("../utils/security/token");
const authentication = (accessRoles = [], tokenType = token_1.TokenEnum.ACCESS) => {
    return async (req, res, next) => {
        if (!req.headers.authorization)
            throw new error_response_1.BadRequestException("Missing authorization header");
        const { user, decoded } = await (0, token_1.decodeToken)({ authorization: req.headers.authorization, tokenType });
        if (!accessRoles.includes(user.role))
            throw new error_response_1.ForbiddenException("You are not authorized to access this route ");
        req.user = user;
        req.decoded = decoded;
        next();
    };
};
exports.authentication = authentication;
