"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = exports.userSchema = exports.RoleEnum = exports.GenderEnum = void 0;
const mongoose_1 = require("mongoose");
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
    freezedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
    },
    freezedAt: Date,
    restoredBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
    },
    restoredAt: Date,
    friends: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "User",
        }],
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
exports.userSchema.pre("save", async function (next) {
    this.wasNew = this.isNew;
    if (this.isModified("password")) {
        this.password = await (0, hash_1.generateHash)(this.password);
    }
    if (this.isModified("confirmEmailOTP")) {
        this.confirmEmailPlainOTP = this.confirmEmailOTP;
        this.confirmEmailOTP = await (0, hash_1.generateHash)(this.confirmEmailOTP);
    }
    next();
});
exports.userSchema.post("save", async function (doc, next) {
    const that = this;
    if (that.wasNew && that.confirmEmailPlainOTP) {
        email_event_1.emailEvent.emit("confirmEmail", { to: this.email, username: this.username, otp: that.confirmEmailPlainOTP });
    }
    next();
});
exports.userSchema.pre(["find", "findOne"], function (next) {
    const query = this.getQuery();
    if (query.paranoid === false) {
        this.setQuery({ ...query });
    }
    else {
        this.setQuery({ ...query, freezedAt: { $exists: false } });
    }
    next();
});
exports.UserModel = mongoose_1.models.User || (0, mongoose_1.model)("User", exports.userSchema);
