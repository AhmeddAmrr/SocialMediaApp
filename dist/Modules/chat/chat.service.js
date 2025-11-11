"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const chat_repository_1 = require("../../DB/repositories/chat.repository");
const chat_model_1 = require("../../DB/models/chat.model");
const user_repository_1 = require("../../DB/repositories/user.repository");
const user_model_1 = require("../../DB/models/user.model");
const mongoose_1 = require("mongoose");
const error_response_1 = require("../../utils/response/error.response");
class ChatService {
    _chatModel = new chat_repository_1.ChatRepository(chat_model_1.ChatModel);
    _userModel = new user_repository_1.UserRepository(user_model_1.UserModel);
    constructor() { }
    getChat = async (req, res) => {
        const { userId } = req.params;
        const chat = await this._chatModel.findOne({
            filter: {
                participants: {
                    $all: [req.user?._id, mongoose_1.Types.ObjectId.createFromHexString(userId)]
                },
                groups: { $exists: false },
            },
            options: {
                populate: "participants",
            },
        });
        if (!chat)
            throw new error_response_1.NotFoundException("Chat not Found & Failed to find ");
        return res.status(200).json({ message: "Done Get Chat", data: { chat } });
    };
    sayHi = ({ message, socket, callback }) => {
        try {
            console.log(message);
            callback ? callback("I recieved your message") : undefined;
        }
        catch (error) {
            socket.emit("custom_error", error);
        }
    };
    sendMessage = async ({ content, socket, sendTo }) => {
        try {
            const createdBy = socket.credentials?.user?._id;
            const recipientUser = await this._userModel.findOne({
                filter: {
                    _id: mongoose_1.Types.ObjectId.createFromHexString(sendTo),
                    friends: { $in: [createdBy] }
                }
            });
            if (!recipientUser)
                throw new error_response_1.NotFoundException("Recipient  user not found or not your friend");
            const chat = await this._chatModel.findOneAndUpdate({
                filter: {
                    participants: {
                        $all: [createdBy, mongoose_1.Types.ObjectId.createFromHexString(sendTo)]
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
                            participants: [createdBy, mongoose_1.Types.ObjectId.createFromHexString(sendTo)],
                            messages: [{
                                    content,
                                    createdBy,
                                }]
                        }]
                })) || [];
                socket.emit("newChat", newChat);
                if (!newChat)
                    throw new error_response_1.BadRequestException("failed to create new chat");
            }
            socket.emit("successMessage", { content });
        }
        catch (error) {
            socket.emit("custom_error", error);
        }
    };
}
exports.ChatService = ChatService;
exports.default = new ChatService();
