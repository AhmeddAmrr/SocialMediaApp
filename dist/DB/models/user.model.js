"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = exports.userSchema = exports.RoleEnum = exports.GenderEnum = void 0;
const mongoose_1 = require("mongoose");
const error_response_1 = require("../../utils/response/error.response");
const hash_1 = require("../../utils/security/hash");
const email_event_1 = require("../../utils/events/email.event");
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
    phone: String,
    address: String,
    gender: { type: String, enum: Object.values(GenderEnum), default: GenderEnum.MALE },
    role: { type: String, enum: Object.values(RoleEnum), default: RoleEnum.USER },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });
exports.userSchema.virtual("username").set(function (value) {
    const [firstName, lastName] = value.split(" ") || [];
    this.set({ firstName, lastName, slug: value.replaceAll(/\s+/g, "-") });
})
    .get(function () {
    return `${this.firstName} ${this.lastName}`;
});
exports.userSchema.pre("validate", async function (next) {
    if (!this.slug?.includes("-"))
        next(new error_response_1.BadRequestException("Slug is Required and must hold '-' "));
});
exports.userSchema.pre("save", async function (next) {
    this.wasNew = this.isNew;
    if (this.isModified("password"))
        this.password = await (0, hash_1.generateHash)(this.password);
    next();
});
exports.userSchema.post("save", function (doc, next) {
    const that = this;
    if (that.wasNew)
        email_event_1.emailEvent.emit("confirmEmail", { to: this.email, otp: 123456 });
});
exports.UserModel = mongoose_1.models.User || (0, mongoose_1.model)("User", exports.userSchema);
