"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatEvent = void 0;
const chat_service_1 = require("./chat.service");
class ChatEvent {
    _chatService = new chat_service_1.ChatService();
    constructor() { }
    ;
    sayHi = (socket) => {
        return socket.on("sayHi", (message, callback) => {
            this._chatService.sayHi({ message, socket, callback });
        });
    };
    sendMessage = (socket) => {
        return socket.on("sendMessage", (data) => {
            this._chatService.sendMessage({ ...data, socket });
        });
    };
}
exports.ChatEvent = ChatEvent;
