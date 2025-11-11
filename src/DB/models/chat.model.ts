import {  HydratedDocument, model, models, Schema, Types } from "mongoose";
import { maxLength, minLength } from "zod";
import { required } from "zod/v4/core/util.cjs";


export interface IMessage {
    
    content: string;


    createdBy: Types.ObjectId;
    createdAt?:Date;
    updatedAt?:Date;
}

export interface IChat {
    
    // OVO
    participants: Types.ObjectId[];
    messages: IMessage[];


    //OVM --> groups
    groups?: string;
    group_image?:string;
    roomId?: string;

    createdBy: Types.ObjectId;
    createdAt:Date;
    updatedAt?:Date;
}
export type HChatDocument = HydratedDocument<IChat>;
export type HMessageDocument = HydratedDocument<IMessage>;


export const messageSchema = new Schema<IMessage> (
    {
        content:{
            type: String,
            required:true,
            maxLength:500000,
            minLength:2,
        },
        createdBy:{
            type: Schema.Types.ObjectId,
            ref: "User",
            required : true,
        }

    },
    {  timestamps:true } 
);


export const chatSchema = new Schema<IChat> (
    {
        participants:[{
            type: Schema.Types.ObjectId,
            ref: "User",
            required : true,
        }],
        createdBy:{
            type: Schema.Types.ObjectId,
            ref: "User",
            required : true,
        },
        groups : String,
        group_image : String,
        roomId: {
            type : String,
            required : function() {
                return this.roomId;
            },
        },
        messages: [messageSchema],

    },
    {  timestamps:true } 
);



export const ChatModel = models.Chat || model<IChat>("Chat" , chatSchema);
