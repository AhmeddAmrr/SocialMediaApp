import {  HydratedDocument, model, models, Schema, Types } from "mongoose";
import { BadRequestException } from "../../utils/response/error.response";
import { generateHash } from "../../utils/security/hash";
import { emailEvent } from "../../utils/events/email.event";


export enum GenderEnum{
    MALE="MALE",
    FEMALE="FEMALE"
}
export enum RoleEnum{
    USER="USER",
    ADMIN="ADMIN"
}

export interface IUser {
    _id: Types.ObjectId;
    firstName: string;
    lastName: string;
    username?:string;
    slug:string;

    email:string;
    confirmEmailOTP?:string;
    confirmedAt?:Date;
    password:string;
    resetPasswordOTP?:string;
    changeCredentialsTime?:Date;

    phone?:string;
    address?:string;

    gender:GenderEnum;
    role:RoleEnum;

    createdAt:Date;
    updatedAt?:Date;
}

export const userSchema = new Schema<IUser> (
    {
        firstName:{
            type:String,
            required:true,
            minlength:3,
            maxlength:25,
        },
        lastName:{
            type:String,
            required:true,
            minlength:3,
            maxlength:25,
        },
        slug:{
            type:String,
            required:true,
            minlength:3,
            maxlength:51,
        },
        email:{ type : String  ,  required:true , unique : true,},
        confirmEmailOTP: String,
        confirmedAt:Date,
        password:{type : String , required : true,},
        resetPasswordOTP:String,
        changeCredentialsTime:Date, 
        phone:String,
        address:String,
        gender:{type:String , enum : Object.values(GenderEnum) , default : GenderEnum.MALE},
        role:{type:String , enum : Object.values(RoleEnum) , default : RoleEnum.USER},

    },
    {  timestamps:true, toJSON:{virtuals:true} ,  toObject:{virtuals : true}  } 
);

userSchema.virtual("username").set(function (value:string){
  const [firstName , lastName] =   value.split(" ") || [];
  this.set({firstName , lastName , slug : value.replaceAll(/\s+/g , "-")});
} )
.get(function (){
    return `${this.firstName} ${this.lastName}`;
});


 userSchema.pre("validate" , async function (next) {
    
    if(!this.slug?.includes("-"))
        next( new BadRequestException("Slug is Required and must hold '-' "))
    
 })

 userSchema.pre("save" , async function(this: HUserDocument & {wasNew : boolean} , next) {

    this.wasNew = this.isNew;
    if( this.isModified("password") )
        this.password = await generateHash(this.password)
    next();
 })
  userSchema.post("save" ,  function(doc , next) {
    const that = this as HUserDocument & {wasNew : boolean};
    if(that.wasNew)
    emailEvent.emit("confirmEmail" , { to:this.email  , otp:123456})
    
 })



export const UserModel = models.User || model<IUser>("User" , userSchema);
export type HUserDocument = HydratedDocument<IUser>;
