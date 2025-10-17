import {  HydratedDocument, model, models, Schema, Types } from "mongoose";


export enum AllowCommentsEnum{
    ALLOW = "ALLOW",
    DENY= "DENY"
}

export enum AvailabilityEnum{
    PUBLIC = "PUBLIC",
    FRIENDS= "FRIENDS",
    ONLYME="ONLYME" 
}
export enum ActionEnum{
    LIKE="LIKE",
    UNLIKE="UNLIKE",

}

export interface IPost {
    content?:string;
    attachments?: string[];
    assetPostFolderId?:string;

    allowComments?: AllowCommentsEnum;
    availability?: AvailabilityEnum;

    tags?:Types.ObjectId[];
    likes?:Types.ObjectId[]; 
    createdBy: Types.ObjectId;

    freezedBy?: Types.ObjectId;
    freezedAt?:Date;

    restoredBy?:Types.ObjectId;
    restoredAt?:Date;

    createdAt:Date;
    updatedAt?:Date;
}
export type HPostDocument = HydratedDocument<IPost>;

export const postSchema = new Schema<IPost> (
    {
        content:{
            type:String,
            minLength:2,
            maxLength:50000,
            required: function(){
                return !this.attachments?.length;
            },
        },
        attachments:[String],
        assetPostFolderId: String,
        allowComments: {
            type:String,
            enum:Object.values(AllowCommentsEnum),
            default: AllowCommentsEnum.ALLOW,
        },
        availability:{
            type:String,
            enum:Object.values(AvailabilityEnum),
            default: AvailabilityEnum.PUBLIC,
        },
        likes:[{
            type: Schema.Types.ObjectId,
            ref:"User"
        }],
        tags:[{
            type: Schema.Types.ObjectId,
            ref:"User"
        }],

        createdBy:{
            type: Schema.Types.ObjectId,
            required:true,
            ref:"User",
        },
        freezedBy:{
            type: Schema.Types.ObjectId,
            ref:"User",
        },
        freezedAt:Date,

        restoredBy:{
            type: Schema.Types.ObjectId,
            ref:"User",
        },
        restoredAt:Date,



    },
    {  timestamps:true } 
);
postSchema.pre(["find", "findOne", "findOneAndUpdate", "updateOne"] ,function (next) {
    const query = this.getQuery();
    
    if(query.paranoid === false){
        this.setQuery({...query});
    }else{
        this.setQuery({...query , freezedAt: {$exists : false}})
    }
    next();
})



export const PostModel = models.Post || model<IPost>("Post" , postSchema);
