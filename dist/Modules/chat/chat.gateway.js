"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGateway = void 0;
const chat_events_1 = require("./chat.events");
class ChatGateway {
    _chatEvent = new chat_events_1.ChatEvent();
    constructor() { }
    register = (socket) => {
        this._chatEvent.sayHi(socket);
        this._chatEvent.sendMessage(socket);
    };
}
exports.ChatGateway = ChatGateway;
