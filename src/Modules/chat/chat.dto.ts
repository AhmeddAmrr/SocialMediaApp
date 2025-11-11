import { IAuthSocket } from "../gateway/gateway.dto";
import { getChatSchema } from "./chat.validation";
import z from "zod";


export interface ISayHiDTO {
    message: string;
    socket: IAuthSocket;
    callback: any;
}

export interface ISendMessageDTO {
    content: string;
    socket: IAuthSocket;
    sendTo: string;
}

export type IGetChatDTO = z.infer<typeof getChatSchema.params>;