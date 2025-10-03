"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRevokeToken = exports.decodeToken = exports.createLoginCredentials = exports.getSignature = exports.getSignatureLevel = exports.verifyToken = exports.generateToken = exports.logoutEnum = exports.TokenEnum = exports.SignatureEnum = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
const user_model_1 = require("../../DB/models/user.model");
const error_response_1 = require("../response/error.response");
const user_repository_1 = require("../../DB/repositories/user.repository");
const uuid_1 = require("uuid");
const token_model_1 = require("../../DB/models/token.model");
const token_repository_1 = require("../../DB/repositories/token.repository");
var SignatureEnum;
(function (SignatureEnum) {
    SignatureEnum["USER"] = "USER";
    SignatureEnum["ADMIN"] = "ADMIN";
})(SignatureEnum || (exports.SignatureEnum = SignatureEnum = {}));
var TokenEnum;
(function (TokenEnum) {
    TokenEnum["ACCESS"] = "ACCESS";
    TokenEnum["REFRESH"] = "REFRESH";
})(TokenEnum || (exports.TokenEnum = TokenEnum = {}));
var logoutEnum;
(function (logoutEnum) {
    logoutEnum["only"] = "ONLY";
    logoutEnum["all"] = "ALL";
})(logoutEnum || (exports.logoutEnum = logoutEnum = {}));
const generateToken = async ({ payload, secret = process.env.ACCESS_USER_SIGNATURE, options = { expiresIn: Number(process.env.ACCESS_EXPIRES_IN) } }) => {
    return await (0, jsonwebtoken_1.sign)(payload, secret, options);
};
exports.generateToken = generateToken;
const verifyToken = async ({ token, secret = process.env.ACCESS_USER_SIGNATURE, }) => {
    return await (0, jsonwebtoken_1.verify)(token, secret);
};
exports.verifyToken = verifyToken;
const getSignatureLevel = async (role = user_model_1.RoleEnum.USER) => {
    let signatureLevel = SignatureEnum.USER;
    switch (role) {
        case user_model_1.RoleEnum.ADMIN:
            signatureLevel = SignatureEnum.ADMIN;
            break;
        case user_model_1.RoleEnum.USER:
            signatureLevel = SignatureEnum.USER;
            break;
        default:
            break;
    }
    return signatureLevel;
};
exports.getSignatureLevel = getSignatureLevel;
const getSignature = async (signatureLevel = SignatureEnum.USER) => {
    let signatures = { access_signature: "", refresh_signature: "" };
    switch (signatureLevel) {
        case SignatureEnum.ADMIN:
            signatures = { access_signature: process.env.ACCESS_ADMIN_SIGNATURE, refresh_signature: process.env.REFRESH_ADMIN_SIGNATURE };
            break;
        case SignatureEnum.USER:
            signatures = { access_signature: process.env.ACCESS_USER_SIGNATURE, refresh_signature: process.env.REFRESH_USER_SIGNATURE };
            break;
        default:
            signatures = { access_signature: process.env.ACCESS_USER_SIGNATURE, refresh_signature: process.env.REFRESH_USER_SIGNATURE };
            break;
    }
    return signatures;
};
exports.getSignature = getSignature;
const createLoginCredentials = async (user) => {
    const signatureLevel = await (0, exports.getSignatureLevel)(user.role);
    const signatures = await (0, exports.getSignature)(signatureLevel);
    const jwtid = (0, uuid_1.v4)();
    const accessToken = await (0, exports.generateToken)({
        payload: { _id: user._id },
        secret: signatures.access_signature,
        options: { expiresIn: Number(process.env.ACCESS_EXPIRES_IN), jwtid },
    });
    const refreshToken = await (0, exports.generateToken)({
        payload: { _id: user._id },
        secret: signatures.refresh_signature,
        options: { expiresIn: Number(process.env.REFRESH_EXPIRES_IN), jwtid },
    });
    return { accessToken, refreshToken };
};
exports.createLoginCredentials = createLoginCredentials;
const decodeToken = async ({ authorization, tokenType = TokenEnum.ACCESS }) => {
    const userModel = new user_repository_1.UserRepository(user_model_1.UserModel);
    const tokenModel = new token_repository_1.TokenRepository(token_model_1.TokenModel);
    const [bearer, token] = authorization.split(" ");
    if (!bearer || !token)
        throw new error_response_1.UnAuthorizedException("Missing Token Parts");
    const signatures = await (0, exports.getSignature)(bearer);
    const signature = tokenType === TokenEnum.REFRESH ? signatures.refresh_signature : signatures.access_signature;
    const decoded = await (0, exports.verifyToken)({ token, secret: signature });
    if (!decoded?._id || !decoded?.iat)
        throw new error_response_1.UnAuthorizedException("Invalid Token Payload");
    if (await tokenModel.findOne({
        filter: { jti: decoded.jti },
    }))
        throw new error_response_1.UnAuthorizedException("Token is Expired - Old Login Credentials");
    const user = await userModel.findOne({
        filter: { _id: decoded._id },
    });
    if (!user)
        throw new error_response_1.NotFoundException("Not Registered User");
    if (user.changeCredentialsTime?.getTime() || 0 > decoded.iat * 1000)
        throw new error_response_1.UnAuthorizedException("Token is Expired - Old Login Credentials");
    return { user, decoded };
};
exports.decodeToken = decodeToken;
const createRevokeToken = async (decoded) => {
    const tokenModel = new token_repository_1.TokenRepository(token_model_1.TokenModel);
    const results = await tokenModel.create({
        data: [{
                jti: decoded?.jti,
                expiresIn: decoded?.exp + Number(process.env.REFRESH_EXPIRES_IN),
                userId: decoded?._id,
            }
        ],
        options: {
            validateBeforeSave: true,
        }
    }) || [];
    if (!results)
        throw new error_response_1.BadRequestException("Token Revoking Failed");
    return results;
};
exports.createRevokeToken = createRevokeToken;
