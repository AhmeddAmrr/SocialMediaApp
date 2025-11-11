import { IAuthSocket } from "../gateway/gateway.dto";
import { ChatEvent } from "./chat.events";

export class ChatGateway {
    private _chatEvent = new ChatEvent();
    constructor() {}

    register = (socket:IAuthSocket ) =>{
        this._chatEvent.sayHi(socket);
        this._chatEvent.sendMessage(socket);
    }
}