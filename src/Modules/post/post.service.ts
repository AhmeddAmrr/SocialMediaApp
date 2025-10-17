import { Request, Response } from "express";
import { PostRepository } from "../../DB/repositories/post.repository";
import { ActionEnum, AvailabilityEnum, PostModel } from "../../DB/models/post.model";
import { UserRepository } from "../../DB/repositories/user.repository";
import { HUserDocument, UserModel } from "../../DB/models/user.model";
import { BadRequestException, NotFoundException } from "../../utils/response/error.response";
import { deleteFiles, uploadFiles } from "../../utils/multer/s3.config";
import { v4 as uuid } from "uuid"
import { LikePostQueryDTO } from "./post.dto";
import { Types, UpdateQuery } from "mongoose";


export const postAvailability = (req: Request) => {
    return [
        { availability: AvailabilityEnum.PUBLIC },
        { availability: AvailabilityEnum.ONLYME, createdBy: req.user?._id },
        {
            availability: AvailabilityEnum.FRIENDS,
            createdBy: {
                $in: [...(req.user?.friends || []), req.user?._id]
            }
        },
        { availability: AvailabilityEnum.ONLYME, tags: { $in: req.user?._id } },
    ]
}


class PostService {
    private _postModel = new PostRepository(PostModel);
    private _userModel = new UserRepository(UserModel);
    constructor() { }

    createPost = async (req: Request, res: Response) => {

        if (req.body.tags?.length && (await this._userModel.find({
            filter: { _id: { $in: req.body.tags } }
        })).length !== req.body.tags.length
        ) {
            throw new NotFoundException("Some mentioned users dont exist");
        }

        let attachments: string[] = [];
        let assetPostFolderId = uuid();
        if (req.files?.length) {
            attachments = await uploadFiles({
                files: req.files as Express.Multer.File[],
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
                await deleteFiles({ urls: attachments });
            }
            throw new BadRequestException("failed to create post");
        }

        return res.status(201).json({ message: "Post created successfully", post })
    }
    likeUnlikePost = async (req: Request, res: Response) => {

        const { postId } = req.params as unknown as { postId: string };

        const { action } = req.query as LikePostQueryDTO;
        let update: UpdateQuery<HUserDocument> = {
            $addToSet: { likes: req.user?._id }
        };
        if (action === ActionEnum.UNLIKE) {
            update = { $pull: { likes: req.user?._id } }
        }
        const post = await this._postModel.findOneAndUpdate({
            filter: {
                _id: postId,
                $or: postAvailability(req),
            },
            update
        })
        if (!post)
            throw new NotFoundException("Post doesnot exist");


        return res.status(200).json({ message: "Done liked or unliked", post })
    }

    updatePost = async (req: Request, res: Response) => {

        const { postId } = req.params as unknown as { postId: string };
        const post = await this._postModel.findOne({
            filter: { _id: postId, createdBy: req.user?._id },
        })
        if (!post)
            throw new NotFoundException("Post does not exist ");

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
                            $setDifference: ["$tags", (req.body.removedTags || []).map((tag:string) =>{
                                return Types.ObjectId.createFromHexString(tag);
                            }) || [],],
                        }, (req.body.tags || []).map((tag:string)=>{
                            return Types.ObjectId.createFromHexString(tag);
                        })]
                    }
                }
            }]
        });
        console.log(req.body.removedAttachments);

        if (!updatePost.modifiedCount) {
            if (attachments.length) {
                await deleteFiles({ urls: attachments });
                throw new BadRequestException("Failed to update post");
            }
        }

        if (req.body.removedAttachments?.length) {
                await deleteFiles({ urls: req.body.removedAttachments });
        }
        


        return res.status(200).json({ message: "Done updated" })
    }

     getPosts = async (req: Request, res: Response) => {
        let { page , size} = req.query as unknown as { page : number , size : number};
       const posts = await this._postModel.paginate({
        filter: {$or : postAvailability(req) },
        page,
        size,
       });


        return res.status(200).json({ message: "get posts done"  , posts})
    }



}

export default new PostService(); 