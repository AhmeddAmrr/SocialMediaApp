"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const post_repository_1 = require("../../DB/repositories/post.repository");
const post_model_1 = require("../../DB/models/post.model");
const user_repository_1 = require("../../DB/repositories/user.repository");
const user_model_1 = require("../../DB/models/user.model");
const comment_repository_1 = require("../../DB/repositories/comment.repository");
const comment_model_1 = require("../../DB/models/comment.model");
const post_service_1 = require("../post/post.service");
const error_response_1 = require("../../utils/response/error.response");
const s3_config_1 = require("../../utils/multer/s3.config");
class ComnmentService {
    _postModel = new post_repository_1.PostRepository(post_model_1.PostModel);
    _userModel = new user_repository_1.UserRepository(user_model_1.UserModel);
    _commentModel = new comment_repository_1.CommentRepository(comment_model_1.CommentModel);
    constructor() { }
    createComment = async (req, res) => {
        const { postId } = req.params;
        const post = await this._postModel.findOne({
            filter: {
                _id: postId,
                allowComments: post_model_1.AllowCommentsEnum.ALLOW,
                $or: (0, post_service_1.postAvailability)(req),
            }
        });
        if (!post)
            throw new error_response_1.NotFoundException("failed to create comment");
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
        const [comment] = await this._commentModel.create({
            data: [{
                    ...req.body,
                    attachments,
                    postId,
                    createdBy: req.user?._id,
                }]
        }) || [];
        if (!comment) {
            if (attachments.length) {
                await (0, s3_config_1.deleteFiles)({ urls: attachments });
            }
            throw new error_response_1.BadRequestException("failed to create comment");
        }
        return res.status(201).json({ message: " comment created successfully" });
    };
    createReply = async (req, res) => {
        const { postId, commentId } = req.params;
        const comment = await this._commentModel.findOne({
            filter: {
                _id: commentId,
                postId: postId,
            },
            options: {
                populate: [{ path: "postId", match: {
                            allowComments: post_model_1.AllowCommentsEnum.ALLOW,
                            $or: (0, post_service_1.postAvailability)(req)
                        },
                    }]
            }
        });
        if (!comment?.postId)
            throw new error_response_1.NotFoundException("failed to create reply");
        if (req.body.tags?.length && (await this._userModel.find({
            filter: { _id: { $in: req.body.tags } }
        })).length !== req.body.tags.length) {
            throw new error_response_1.NotFoundException("Some mentioned users dont exist");
        }
        let attachments = [];
        if (req.files?.length) {
            const post = comment.postId;
            attachments = await (0, s3_config_1.uploadFiles)({
                files: req.files,
                path: `users/${post.createdBy}/post/${post.assetPostFolderId}`
            });
        }
        const [reply] = await this._commentModel.create({
            data: [{
                    ...req.body,
                    attachments,
                    postId,
                    commentId,
                    createdBy: req.user?._id,
                }]
        }) || [];
        if (!reply) {
            if (attachments.length) {
                await (0, s3_config_1.deleteFiles)({ urls: attachments });
            }
            throw new error_response_1.BadRequestException("failed to create reply");
        }
        return res.status(201).json({ message: " reply created successfully", reply });
    };
}
exports.default = new ComnmentService();
