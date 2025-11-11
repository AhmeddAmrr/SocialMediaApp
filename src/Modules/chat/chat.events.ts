import { IAuthSocket } from "../gateway/gateway.dto";
import { ChatService } from "./chat.service";


export class ChatEvent {
    private _chatService = new ChatService();
    constructor() {};

    sayHi = (socket:IAuthSocket)=>{
        return socket.on("sayHi" , (message , callback)=>{
            this._chatService.sayHi({message , socket , callback})
        })
    }
    sendMessage = (socket:IAuthSocket)=>{
        return socket.on("sendMessage" ,
            ( data :  { content : string ; sendTo : string } ) =>{
            this._chatService.sendMessage({...data , socket })
            }
        )
    }
}