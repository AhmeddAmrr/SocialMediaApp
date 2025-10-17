import z from "zod";
import { logoutEnum } from "../../utils/security/token";
import { generalFields } from "../../middlewares/validation.middleware";



export const logOutSchema ={
    body: z.strictObject({
        flag : z.enum(logoutEnum).default(logoutEnum.only),
    }),
}

export const sendFriendRequestSchema ={
    params: z.strictObject({
        userId : generalFields.id,
    }),

    
}

export const acceptFriendRequestSchema ={
    params: z.strictObject({
        requestId : generalFields.id,
    }),
}