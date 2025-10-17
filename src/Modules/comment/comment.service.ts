import { Request, Response } from "express";
import { PostRepository } from "../../DB/repositories/post.repository";
import { AllowCommentsEnum, HPostDocument, PostModel } from "../../DB/models/post.model";
import { UserRepository } from "../../DB/repositories/user.repository";
import { UserModel } from "../../DB/models/user.model";
import { CommentRepository } from "../../DB/repositories/comment.repository";
import { CommentModel } from "../../DB/models/comment.model";
import { postAvailability } from "../post/post.service";
import { BadRequestException, NotFoundException } from "../../utils/response/error.response";
import { deleteFiles, uploadFiles } from "../../utils/multer/s3.config";






class ComnmentService {
    private _postModel = new PostRepository(PostModel);
    private _userModel = new UserRepository(UserModel);
    private _commentModel = new CommentRepository(CommentModel);

    constructor() { }

    createComment = async (req: Request, res: Response) => {

        const { postId } = req.params as unknown as { postId: string }
        const post = await this._postModel.findOne({
            filter: {
                _id: postId,
                allowComments: AllowCommentsEnum.ALLOW,
                $or: postAvailability(req),
            }
        })
        if (!post)
            throw new NotFoundException("failed to create comment")


        if (req.body.tags?.length && (await this._userModel.find({
            filter: { _id: { $in: req.body.tags } }
        })).length !== req.body.tags.length
        ) {
            throw new NotFoundException("Some mentioned users dont exist");
        }

        let attachments: string[] = [];
        if (req.files?.length) {
            attachments = await uploadFiles({
                files: req.files as Express.Multer.File[],
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
                await deleteFiles({ urls: attachments });
            }
            throw new BadRequestException("failed to create comment");
        }

        return res.status(201).json({ message: " comment created successfully" })
    }

    createReply = async (req: Request, res: Response) => {

        const { postId, commentId } = req.params as unknown as { postId: string; commentId: string; }
        const comment = await this._commentModel.findOne({
            filter: {
                _id: commentId,
                postId: postId,
            },
            options:{
                populate: [ { path : "postId" , match : {
                    allowComments: AllowCommentsEnum.ALLOW,
                    $or: postAvailability(req)
                },
            } ]
            }
        })
        if (!comment?.postId)
            throw new NotFoundException("failed to create reply")


        if (req.body.tags?.length && (await this._userModel.find({
            filter: { _id: { $in: req.body.tags } }
        })).length !== req.body.tags.length
        ) {
            throw new NotFoundException("Some mentioned users dont exist");
        }

        let attachments: string[] = [];
        if (req.files?.length) {
            const post = comment.postId as Partial<HPostDocument>;
            attachments = await uploadFiles({
                files: req.files as Express.Multer.File[],
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
                await deleteFiles({ urls: attachments });
            }
            throw new BadRequestException("failed to create reply");
        }

        return res.status(201).json({ message: " reply created successfully"  , reply})
    }
}

export default new ComnmentService(); 