import { Router } from "express";
import userService from "./user.service";
import { authentication } from "../../middlewares/authentication.middleware";
import { endPoint } from "./user.authorization";
import { TokenEnum } from "../../utils/security/token";
import { validation } from "../../middlewares/validation.middleware";
import * as validators from "./user.validation";



const router = Router();

router.get("/profile" , authentication(endPoint.profile ) , userService.getProfile)

router.post("/logout" , authentication(endPoint.logout ) , userService.logout)

router.post("/refresh-token" , authentication(endPoint.refreshToken ,  TokenEnum.REFRESH ) , userService.refreshToken)

router.post(
    "/:userId/friend-request" ,
     authentication(endPoint.friendRequest ,  TokenEnum.ACCESS ),
     validation(validators.sendFriendRequestSchema) ,
      userService.sendFriendRequest)

router.patch(
    "/:requestId/accept" ,
     authentication(endPoint.acceptFriendRequest ,  TokenEnum.ACCESS ),
     validation(validators.acceptFriendRequestSchema) ,
      userService.acceptFriendRequest)




export default router; 