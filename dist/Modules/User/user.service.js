"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const token_1 = require("../../utils/security/token");
const user_model_1 = require("../../DB/models/user.model");
const user_repository_1 = require("../../DB/repositories/user.repository");
const FriendRequest_repository_1 = require("../../DB/repositories/FriendRequest.repository");
const friendRequest_model_1 = require("../../DB/models/friendRequest.model");
const error_response_1 = require("../../utils/response/error.response");
class UserService {
    _userModel = new user_repository_1.UserRepository(user_model_1.UserModel);
    _friendModel = new FriendRequest_repository_1.FriendRequestRepository(friendRequest_model_1.FriendRequestModel);
    constructor() { }
    getProfile = async (req, res) => {
        await req.user?.populate("friends");
        return res.status(200).json({ message: "User Profile", user: req.user, decoded: req.decoded });
    };
    logout = async (req, res) => {
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
    refreshToken = async (req, res) => {
        const credentials = await (0, token_1.createLoginCredentials)(req.user);
        await (0, token_1.createRevokeToken)(req.decoded);
        return res.status(200).json({ message: "Token Refreshed", data: credentials });
    };
    sendFriendRequest = async (req, res) => {
        const { userId } = req.params;
        const checkFriendRequestExists = await this._friendModel.findOne({
            filter: {
                createdBy: {
                    $in: [req.user?._id, userId]
                },
                sendTo: {
                    $in: [req.user?._id, userId]
                },
            }
        });
        if (checkFriendRequestExists)
            throw new error_response_1.ConflictException("friend request alrady exists ");
        const user = await this._userModel.findOne({
            filter: {
                _id: userId,
            }
        });
        if (!user)
            throw new error_response_1.NotFoundException("user not found");
        const [friend] = await this._friendModel.create({
            data: [{
                    createdBy: req.user?._id,
                    sendTo: userId,
                }]
        }) || [];
        if (!friend)
            throw new error_response_1.BadRequestException("failed to send friend request");
        return res.status(201).json({ message: "Friend request sent", data: friend });
    };
    acceptFriendRequest = async (req, res) => {
        const { requestId } = req.params;
        const checkFriendRequestExists = await this._friendModel.findOneAndUpdate({
            filter: {
                _id: requestId,
                sendTo: req.user?._id,
                acceptedAt: { $exists: false }
            },
            update: {
                acceptedAt: new Date(),
            },
        });
        if (!checkFriendRequestExists)
            throw new error_response_1.ConflictException("failed to accept friend request ");
        await Promise.all([
            await this._userModel.updateOne({
                filter: {
                    _id: checkFriendRequestExists.createdBy,
                },
                update: {
                    $addToSet: {
                        friends: checkFriendRequestExists.sendTo,
                    }
                }
            }),
            await this._userModel.updateOne({
                filter: {
                    _id: checkFriendRequestExists.sendTo,
                },
                update: {
                    $addToSet: {
                        friends: checkFriendRequestExists.createdBy,
                    }
                }
            })
        ]);
        return res.status(201).json({ message: "Friend request accepted" });
    };
}
exports.default = new UserService();
