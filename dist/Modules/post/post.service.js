"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postAvailability = void 0;
const post_repository_1 = require("../../DB/repositories/post.repository");
const post_model_1 = require("../../DB/models/post.model");
const user_repository_1 = require("../../DB/repositories/user.repository");
const user_model_1 = require("../../DB/models/user.model");
const error_response_1 = require("../../utils/response/error.response");
const s3_config_1 = require("../../utils/multer/s3.config");
const uuid_1 = require("uuid");
const mongoose_1 = require("mongoose");
const postAvailability = (req) => {
    return [
        { availability: post_model_1.AvailabilityEnum.PUBLIC },
        { availability: post_model_1.AvailabilityEnum.ONLYME, createdBy: req.user?._id },
        {
            availability: post_model_1.AvailabilityEnum.FRIENDS,
            createdBy: {
                $in: [...(req.user?.friends || []), req.user?._id]
            }
        },
        { availability: post_model_1.AvailabilityEnum.ONLYME, tags: { $in: req.user?._id } },
    ];
};
exports.postAvailability = postAvailability;
class PostService {
    _postModel = new post_repository_1.PostRepository(post_model_1.PostModel);
    _userModel = new user_repository_1.UserRepository(user_model_1.UserModel);
    constructor() { }
    createPost = async (req, res) => {
        if (req.body.tags?.length && (await this._userModel.find({
            filter: { _id: { $in: req.body.tags } }
        })).length !== req.body.tags.length) {
            throw new error_response_1.NotFoundException("Some mentioned users dont exist");
        }
        let attachments = [];
        let assetPostFolderId = (0, uuid_1.v4)();
        if (req.files?.length) {
            attachments = await (0, s3_config_1.uploadFiles)({
                files: req.files,
                path: `users/${req.user?._id}/post/${assetPostFolderId}`
            });
        }
        const [post] = await this._postModel.create({
            data: [{
                    ...req.body,
                    attachments,
                    assetPostFolderId,
                    createdBy: req.user?._id,
                }]
        }) || [];
        if (!post) {
            if (attachments.length) {
                await (0, s3_config_1.deleteFiles)({ urls: attachments });
            }
            throw new error_response_1.BadRequestException("failed to create post");
        }
        return res.status(201).json({ message: "Post created successfully", post });
    };
    likeUnlikePost = async (req, res) => {
        const { postId } = req.params;
        const { action } = req.query;
        let update = {
            $addToSet: { likes: req.user?._id }
        };
        if (action === post_model_1.ActionEnum.UNLIKE) {
            update = { $pull: { likes: req.user?._id } };
        }
        const post = await this._postModel.findOneAndUpdate({
            filter: {
                _id: postId,
                $or: (0, exports.postAvailability)(req),
            },
            update
        });
        if (!post)
            throw new error_response_1.NotFoundException("Post doesnot exist");
        return res.status(200).json({ message: "Done liked or unliked", post });
    };
    updatePost = async (req, res) => {
        const { postId } = req.params;
        const post = await this._postModel.findOne({
            filter: { _id: postId, createdBy: req.user?._id },
        });
        if (!post)
            throw new error_response_1.NotFoundException("Post does not exist ");
        if (req.body.tags?.length && (await this._userModel.find({
            filter: { _id: { $in: req.body.tags } }
        })).length !== req.body.tags.length) {
            throw new error_response_1.NotFoundException("Some mentioned users dont exist");
        }
        let attachments = [];
        if (req.files?.length) {
            attachments = await (0, s3_config_1.uploadFiles)({
                files: req.files,
                path: `users/${post.createdBy}/post/${post.assetPostFolderId}`
            });
        }
        const updatePost = await this._postModel.updateOne({
            filter: { _id: postId },
            update: [{
                    $set: {
                        content: req.body.content,
                        allowComments: req.body.allowComments || post.allowComments,
                        availability: req.body.availability || post.availability,
                        attachments: {
                            $setUnion: [{
                                    $setDifference: ["$attachments", req.body.removedAttachments || [],],
                                }, attachments]
                        },
                        tags: {
                            $setUnion: [{
                                    $setDifference: ["$tags", (req.body.removedTags || []).map((tag) => {
                                            return mongoose_1.Types.ObjectId.createFromHexString(tag);
                                        }) || [],],
                                }, (req.body.tags || []).map((tag) => {
                                    return mongoose_1.Types.ObjectId.createFromHexString(tag);
                                })]
                        }
                    }
                }]
        });
        console.log(req.body.removedAttachments);
        if (!updatePost.modifiedCount) {
            if (attachments.length) {
                await (0, s3_config_1.deleteFiles)({ urls: attachments });
                throw new error_response_1.BadRequestException("Failed to update post");
            }
        }
        if (req.body.removedAttachments?.length) {
            await (0, s3_config_1.deleteFiles)({ urls: req.body.removedAttachments });
        }
        return res.status(200).json({ message: "Done updated" });
    };
    getPosts = async (req, res) => {
        let { page, size } = req.query;
        const posts = await this._postModel.paginate({
            filter: { $or: (0, exports.postAvailability)(req) },
            page,
            size,
        });
        return res.status(200).json({ message: "get posts done", posts });
    };
}
exports.default = new PostService();
