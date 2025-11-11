import { Request, Response } from "express";
import { IGetChatDTO, ISayHiDTO, ISendMessageDTO } from "./chat.dto";
import { ChatRepository } from "../../DB/repositories/chat.repository";
import { ChatModel } from "../../DB/models/chat.model";
import { UserRepository } from "../../DB/repositories/user.repository";
import { UserModel } from "../../DB/models/user.model";
import { Types } from "mongoose";
import { BadRequestException, NotFoundException } from "../../utils/response/error.response";


export class ChatService {
    private _chatModel = new ChatRepository(ChatModel);
    private _userModel = new UserRepository(UserModel);

    constructor() { }

    getChat = async (req: Request, res: Response) => {

        const { userId } = req.params as IGetChatDTO;
        const chat = await this._chatModel.findOne({
            filter: {
                participants: {
                    $all: [req.user?._id as Types.ObjectId, Types.ObjectId.createFromHexString(userId)]
                },
                groups: { $exists: false },
            },
            options: {
                populate: "participants",
            },
        });
        if (!chat)
            throw new NotFoundException("Chat not Found & Failed to find ")




        return res.status(200).json({ message: "Done Get Chat", data: { chat } })
    }





    sayHi = ({ message, socket, callback }: ISayHiDTO) => {
        try {
            console.log(message);
            callback ? callback("I recieved your message") : undefined;
        } catch (error) {
            socket.emit("custom_error", error)
        }
    }

    sendMessage = async ({ content, socket, sendTo }: ISendMessageDTO) => {
        try {
            const createdBy = socket.credentials?.user?._id as Types.ObjectId;
            const recipientUser = await this._userModel.findOne({
                filter: {
                    _id: Types.ObjectId.createFromHexString(sendTo),
                    friends: { $in: [createdBy] }
                }
            });
            if (!recipientUser)
                throw new NotFoundException("Recipient  user not found or not your friend");

            const chat = await this._chatModel.findOneAndUpdate({
                filter: {
                    participants: {
                        $all: [createdBy as Types.ObjectId, Types.ObjectId.createFromHexString(sendTo)]
                    },
                    groups: { $exists: false },
                },
                update: {
                    $addToSet: {
                        messages: {
                            content,
                            createdBy,
                        }
                    }
                }
            });
            if (!chat) {
                const [newChat] = (await this._chatModel.create({
                    data: [{
                        createdBy,
                        participants: [createdBy as Types.ObjectId, Types.ObjectId.createFromHexString(sendTo)],
                        messages: [{
                            content,
                            createdBy,
                        }]
                    }]
                })) || [];
                socket.emit("newChat" , newChat);
                if (!newChat)
                    throw new BadRequestException("failed to create new chat");
            }

            socket.emit("successMessage" , {content});

        } catch (error) {
            socket.emit("custom_error", error)
        }
    }
}

export default new ChatService();