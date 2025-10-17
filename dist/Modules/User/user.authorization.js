"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.endPoint = void 0;
const user_model_1 = require("../../DB/models/user.model");
exports.endPoint = {
    profile: [user_model_1.RoleEnum.USER, user_model_1.RoleEnum.ADMIN],
    logout: [user_model_1.RoleEnum.USER, user_model_1.RoleEnum.ADMIN],
    refreshToken: [user_model_1.RoleEnum.USER, user_model_1.RoleEnum.ADMIN],
    friendRequest: [user_model_1.RoleEnum.USER],
    acceptFriendRequest: [user_model_1.RoleEnum.USER],
};
