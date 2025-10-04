import { HydratedDocument, model, models, Schema, Types, UpdateQuery } from "mongoose";
import { TokenRepository } from "../repositories/token.repository";
import { TokenModel } from "./token.model";


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

    freezedAt?: Date,
    createdAt: Date;
    updatedAt?: Date;
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
        freezedAt: Date,
        phone: String,
        address: String,
        gender: { type: String, enum: Object.values(GenderEnum), default: GenderEnum.MALE },
        role: { type: String, enum: Object.values(RoleEnum), default: RoleEnum.USER },

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

userSchema.pre(["findOneAndUpdate", "updateOne"], async function (next) {
    const query = this.getQuery();
    const update = this.getUpdate() as UpdateQuery<HUserDocument>;
    if (update.freezedAt) {
        this.setUpdate({ ...update, changeCredentialsTime: new Date() })
    }

})

userSchema.post(["findOneAndUpdate", "updateOne"], async function (next) {
    const query = this.getQuery();
    const update = this.getUpdate() as UpdateQuery<HUserDocument>;


    if (update["$set"].changeCredentialsTime) {
        const tokenModel = new TokenRepository(TokenModel);
        await tokenModel.deleteMany({ filter: { userId: query._id } })
    }


})




export const UserModel = models.User || model<IUser>("User", userSchema);
export type HUserDocument = HydratedDocument<IUser>;
