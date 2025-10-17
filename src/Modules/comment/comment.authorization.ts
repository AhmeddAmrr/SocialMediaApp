import { RoleEnum } from "../../DB/models/user.model";


export const endPoint = {

    createComment: [RoleEnum.USER , RoleEnum.ADMIN],
    createReply: [RoleEnum.USER , RoleEnum.ADMIN],


}