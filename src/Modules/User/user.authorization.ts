import { RoleEnum } from "../../DB/models/user.model";


export const endPoint = {
    profile: [RoleEnum.USER , RoleEnum.ADMIN],
    logout: [RoleEnum.USER , RoleEnum.ADMIN],
    refreshToken: [RoleEnum.USER , RoleEnum.ADMIN],



}