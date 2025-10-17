import { HydratedDocument, model, models, Schema, Types } from "mongoose";
import { generateHash } from "../../utils/security/hash";
import { emailEvent } from "../../utils/events/email.event";


export enum GenderEnum {
    MALE = "MALE",
    FEMALE = "FEMALE"
}
export enum RoleEnum {
    USER = "USER",
    ADMIN = "ADMIN"
}

export interface IUser {
    _id: Types.ObjectId;
    firstName: string;
    lastName: string;
    username?: string;
    slug: string;

    email: string;
    confirmEmailOTP?: string;
    confirmedAt?: Date;
    password: string;
    resetPasswordOTP?: string;
    changeCredentialsTime?: Date;

    phone?: string;
    address?: string;

    gender: GenderEnum;
    role: RoleEnum;

    freezedBy?: Types.ObjectId;
    freezedAt?:Date;

    restoredBy?:Types.ObjectId;
    restoredAt?:Date;

    createdAt: Date;
    updatedAt?: Date;
    friends?: Types.ObjectId[];
}

export const userSchema = new Schema<IUser>(
    {
        firstName: {
            type: String,
            required: true,
            minlength: 3,
            maxlength: 25,
        },
        lastName: {
            type: String,
            required: true,
            minlength: 3,
            maxlength: 25,
        },
        slug: {
            type: String,
            required: true,
            minlength: 3,
            maxlength: 51,
        },
        email: { type: String, required: true, unique: true, },
        confirmEmailOTP: String,
        confirmedAt: Date,
        password: { type: String, required: true, },
        resetPasswordOTP: String,
        changeCredentialsTime: Date,
        phone: String,
        address: String,
        gender: { type: String, enum: Object.values(GenderEnum), default: GenderEnum.MALE },
        role: { type: String, enum: Object.values(RoleEnum), default: RoleEnum.USER },
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
        friends: [{
            type: Schema.Types.ObjectId,
            ref: "User",
        }],


    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

userSchema
    .virtual("username")
    .set(function (value: string) {
        const [firstName, lastName] = value.split(" ") || [];
        this.set({ firstName, lastName, slug: value.replaceAll(/\s+/g, "-") });
    })
    .get(function () {
        return `${this.firstName} ${this.lastName}`;
    });

userSchema.pre("save", async function (this: HUserDocument & { wasNew: boolean; confirmEmailPlainOTP?: string }, next) {
    this.wasNew = this.isNew;
    if (this.isModified("password")) {
        this.password = await generateHash(this.password)
    }

    if (this.isModified("confirmEmailOTP")) {
        this.confirmEmailPlainOTP = this.confirmEmailOTP as string;
        this.confirmEmailOTP = await generateHash(this.confirmEmailOTP as string)
    }
    next();
});

userSchema.post("save", async function (doc, next) {
    const that = this as HUserDocument & { wasNew: boolean; confirmEmailPlainOTP?: string }
    if (that.wasNew && that.confirmEmailPlainOTP) {
        emailEvent.emit("confirmEmail", { to: this.email, username: this.username, otp: that.confirmEmailPlainOTP })
    }
    next();
})
userSchema.pre(["find", "findOne"] ,function (next) {
    const query = this.getQuery();
    
    if(query.paranoid === false){
        this.setQuery({...query});
    }else{
        this.setQuery({...query , freezedAt: {$exists : false}})
    }
    next();
})


export const UserModel = models.User || model<IUser>("User", userSchema);
export type HUserDocument = HydratedDocument<IUser>;
