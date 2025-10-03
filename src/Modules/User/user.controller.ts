import { Router } from "express";
import userService from "./user.service";
import { authentication } from "../../middlewares/authentication.middleware";
import { endPoint } from "./user.authorization";
import { TokenEnum } from "../../utils/security/token";


const router = Router();

router.get("/profile" , authentication(endPoint.profile ) , userService.getProfile)

router.post("/logout" , authentication(endPoint.logout ) , userService.logout)

router.post("/refresh-token" , authentication(endPoint.refreshToken ,  TokenEnum.REFRESH ) , userService.refreshToken)



export default router; 