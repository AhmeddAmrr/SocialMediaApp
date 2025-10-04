"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = exports.userSchema = exports.RoleEnum = exports.GenderEnum = void 0;
const mongoose_1 = require("mongoose");
const token_repository_1 = require("../repositories/token.repository");
const token_model_1 = require("./token.model");
var GenderEnum;
(function (GenderEnum) {
    GenderEnum["MALE"] = "MALE";
    GenderEnum["FEMALE"] = "FEMALE";
})(GenderEnum || (exports.GenderEnum = GenderEnum = {}));
var RoleEnum;
(function (RoleEnum) {
    RoleEnum["USER"] = "USER";
    RoleEnum["ADMIN"] = "ADMIN";
})(RoleEnum || (exports.RoleEnum = RoleEnum = {}));
exports.userSchema = new mongoose_1.Schema({
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
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });
exports.userSchema
    .virtual("username")
    .set(function (value) {
    const [firstName, lastName] = value.split(" ") || [];
    this.set({ firstName, lastName, slug: value.replaceAll(/\s+/g, "-") });
})
    .get(function () {
    return `${this.firstName} ${this.lastName}`;
});
exports.userSchema.pre(["findOneAndUpdate", "updateOne"], async function (next) {
    const query = this.getQuery();
    const update = this.getUpdate();
    if (update.freezedAt) {
        this.setUpdate({ ...update, changeCredentialsTime: new Date() });
    }
});
exports.userSchema.post(["findOneAndUpdate", "updateOne"], async function (next) {
    const query = this.getQuery();
    const update = this.getUpdate();
    if (update["$set"].changeCredentialsTime) {
        const tokenModel = new token_repository_1.TokenRepository(token_model_1.TokenModel);
        await tokenModel.deleteMany({ filter: { userId: query._id } });
    }
});
exports.UserModel = mongoose_1.models.User || (0, mongoose_1.model)("User", exports.userSchema);
