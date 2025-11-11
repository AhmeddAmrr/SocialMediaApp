"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.endPoint = void 0;
const user_model_1 = require("../../DB/models/user.model");
exports.endPoint = {
    getChat: [user_model_1.RoleEnum.USER, user_model_1.RoleEnum.ADMIN],
};
