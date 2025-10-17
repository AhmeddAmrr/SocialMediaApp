import { Router } from "express";
import postService from "./post.service";
import * as validators from "./post.validation";
import { authentication } from "../../middlewares/authentication.middleware";
import { endPoint } from "./post.authorization";
import { TokenEnum } from "../../utils/security/token";
import { cloudFileUpload, fileValidation } from "../../utils/multer/cloud.multer";
import { validation } from "../../middlewares/validation.middleware";
import commentRouter from "../comment/comment.controller";


const router: Router = Router({});

router.use("/:postId/comment", commentRouter)

router.post(
    "/",
    authentication(endPoint.createPost, TokenEnum.ACCESS),
    cloudFileUpload({ validation: fileValidation.image }).array("attachments", 3),
    validation(validators.createPostSchema),
    postService.createPost
)

router.patch(
    "/:postId/like",
    authentication(endPoint.createPost, TokenEnum.ACCESS),
    validation(validators.likeUnlikePostSchema),
    postService.likeUnlikePost
)

router.patch(
    "/:postId",
    authentication(endPoint.createPost, TokenEnum.ACCESS),
    cloudFileUpload({ validation: fileValidation.image }).array("attachments", 3),
    validation(validators.updatePostSchema),
    postService.updatePost
)

router.get(
    "/",
    authentication(endPoint.createPost, TokenEnum.ACCESS),
    postService.getPosts
)


export default router;