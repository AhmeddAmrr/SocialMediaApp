import { Router } from "express";
import { authentication } from "../../middlewares/authentication.middleware";
import { endPoint } from "./chat.authorization";
import { TokenEnum } from "../../utils/security/token";
import { validation } from "../../middlewares/validation.middleware";
import * as validators from "./chat.validation";
import  chatService  from "./chat.service";


const router: Router = Router({
    mergeParams:true,
});

router.get("/" , authentication(endPoint.getChat , TokenEnum.ACCESS), validation(validators.getChatSchema), chatService.getChat )


export default router;