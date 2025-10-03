import { Router } from "express";
import  authService from "./Auth.service";
import { validation } from "../../middlewares/validation.middleware";
import { confirmEmailSchema, loginSchema, signUpSchema } from "./auth.validation";
import { authentication } from "../../middlewares/authentication.middleware";
import { cloudFileUpload, fileValidation, storageEnum } from "../../utils/multer/cloud.multer";
import { endPoint } from "./auth.authorization";
import { TokenEnum } from "../../utils/security/token";

const router:Router = Router();

router.post("/signup" ,validation(signUpSchema), authService.signup);

router.post("/login" ,validation(loginSchema), authService.login);

router.patch(
    "/profile-image" ,
     authentication(endPoint.profileImage , TokenEnum.ACCESS),
     cloudFileUpload({storageApproach : storageEnum.MEMORY , validation : fileValidation.image  }).single("attachment"), authService.profileImage);

router.patch(
    "/cover-images" ,
     authentication(endPoint.profileImage , TokenEnum.ACCESS),
     cloudFileUpload({storageApproach : storageEnum.DISK , validation : fileValidation.image , maxSize : 2 }).array("attachments",5), authService.coverImages);

router.patch("/confirm-email" ,validation(confirmEmailSchema), authService.confirmEmail);


export default router;