import { Router } from "express";
import commentService from "./comment.service";
import { authentication } from "../../middlewares/authentication.middleware";
import { TokenEnum } from "../../utils/security/token";
import { endPoint } from "./comment.authorization";
import { validation } from "../../middlewares/validation.middleware";
import * as vallidators from "./comment.validation"
import { cloudFileUpload, fileValidation } from "../../utils/multer/cloud.multer";

const router: Router = Router({
    mergeParams: true,
});

router.post(
    "/",
    authentication(endPoint.createComment, TokenEnum.ACCESS),
    cloudFileUpload({ validation: fileValidation.image }).array("attachments", 3),
    validation(vallidators.createCommentSchema),
    commentService.createComment
)

router.post(
    "/:commentId/reply",
    authentication(endPoint.createReply, TokenEnum.ACCESS),
    cloudFileUpload({ validation: fileValidation.image }).array("attachments", 3),
    validation(vallidators.createReplySchema),
    commentService.createReply
)



export default router;