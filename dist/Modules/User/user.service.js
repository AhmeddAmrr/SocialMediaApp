"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const token_1 = require("../../utils/security/token");
const user_model_1 = require("../../DB/models/user.model");
const user_repository_1 = require("../../DB/repositories/user.repository");
class UserService {
    _userModel = new user_repository_1.UserRepository(user_model_1.UserModel);
    constructor() { }
    getProfile = async (req, res, next) => {
        return res.status(200).json({ message: "User Profile", user: req.user, decoded: req.decoded });
    };
    logout = async (req, res, next) => {
        const { flag } = req.body;
        let statusCode = 200;
        const update = {};
        switch (flag) {
            case token_1.logoutEnum.all:
                update.changeCredentialsTime = new Date();
                break;
            case token_1.logoutEnum.only:
                await (0, token_1.createRevokeToken)(req.decoded);
                statusCode = 201;
                break;
            default:
                break;
        }
        await this._userModel.updateOne({
            filter: {
                _id: req.decoded?.id,
            },
            update,
        });
        return res.status(statusCode).json({ message: "User Logged Out" });
    };
    refreshToken = async (req, res, next) => {
        const credentials = await (0, token_1.createLoginCredentials)(req.user);
        await (0, token_1.createRevokeToken)(req.decoded);
        return res.status(200).json({ message: "Token Refreshed", data: credentials });
    };
}
exports.default = new UserService();
