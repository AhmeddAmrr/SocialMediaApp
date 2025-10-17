"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FriendRequestModel = exports.FriendRequestSchema = void 0;
const mongoose_1 = require("mongoose");
exports.FriendRequestSchema = new mongoose_1.Schema({
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        ref: "User",
    },
    sendTo: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        ref: "User",
    },
    acceptedAt: Date,
}, { timestamps: true });
exports.FriendRequestModel = mongoose_1.models.FriendRequest || (0, mongoose_1.model)("FriendRequest", exports.FriendRequestSchema);
