import { NextFunction, Request, Response } from "express"
import { ILogoutDTO } from "./user.dto";
import { createLoginCredentials, createRevokeToken, logoutEnum } from "../../utils/security/token";
import { Types, UpdateQuery } from "mongoose";
import { HUserDocument, IUser, UserModel } from "../../DB/models/user.model";
import { UserRepository } from "../../DB/repositories/user.repository";
import { JwtPayload } from "jsonwebtoken";
import { FriendRequestRepository } from "../../DB/repositories/FriendRequest.repository";
import { FriendRequestModel } from "../../DB/models/friendRequest.model";
import { BadRequestException, ConflictException, NotFoundException } from "../../utils/response/error.response";



class UserService {

    private _userModel = new UserRepository(UserModel);
    private _friendModel = new FriendRequestRepository(FriendRequestModel);

    constructor() { }

    getProfile = async (req: Request, res: Response) => {

        return res.status(200).json({ message: "User Profile", user: req.user, decoded: req.decoded });

    };

    logout = async (req: Request, res: Response) => {

        const { flag }: ILogoutDTO = req.body;

        let statusCode = 200
        const update: UpdateQuery<IUser> = {}

        switch (flag) {
            case logoutEnum.all:
                update.changeCredentialsTime = new Date();
                break;

            case logoutEnum.only:
                await createRevokeToken(req.decoded as JwtPayload);
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

        })


        return res.status(statusCode).json({ message: "User Logged Out" });

    };

    refreshToken = async (req: Request, res: Response): Promise<Response> => {

        const credentials = await createLoginCredentials(req.user as HUserDocument)
        await createRevokeToken(req.decoded as JwtPayload);

        return res.status(200).json({ message: "Token Refreshed", data: credentials })
    }

    sendFriendRequest = async (req: Request, res: Response): Promise<Response> => {
        const { userId } = req.params as unknown as { userId: Types.ObjectId };
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
            throw new ConflictException("friend request alrady exists ");

        const user = await this._userModel.findOne({
            filter: {
                _id: userId,
            }
        });
        if (!user)
            throw new NotFoundException("user not found");


        const [friend] = await this._friendModel.create({
            data: [{
                createdBy: req.user?._id as Types.ObjectId,
                sendTo: userId,
            }]
        }) || [];

        if (!friend)
            throw new BadRequestException("failed to send friend request")


        return res.status(201).json({ message: "Friend request sent", data: friend });
    }

    acceptFriendRequest = async (req: Request, res: Response): Promise<Response> => {
        const { requestId } = req.params as unknown as { requestId: Types.ObjectId };

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
            throw new ConflictException("failed to accept friend request ");

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
        ])


        return res.status(201).json({ message: "Friend request accepted" });
    }
}

export default new UserService(); 