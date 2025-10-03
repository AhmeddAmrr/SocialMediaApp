import { NextFunction, Request, Response } from "express"
import { ILogoutDTO } from "./user.dto";
import { createLoginCredentials, createRevokeToken, logoutEnum } from "../../utils/security/token";
import {  UpdateQuery } from "mongoose";
import { HUserDocument, IUser, UserModel } from "../../DB/models/user.model";
import { UserRepository } from "../../DB/repositories/user.repository";
import { JwtPayload } from "jsonwebtoken";



class UserService{

    private _userModel = new UserRepository(UserModel);

    constructor(){}

    getProfile = async (req:Request, res:Response, next: NextFunction) =>{

        return res.status(200).json({message : "User Profile"  , user:req.user ,decoded : req.decoded });
        
    };

    logout = async (req:Request, res:Response, next: NextFunction) =>{

        const {flag}:ILogoutDTO = req.body;

        let statusCode = 200
        const update:UpdateQuery<IUser> = {}

        switch (flag) {
            case logoutEnum.all:
                update.changeCredentialsTime = new Date();
                break;
        
            case logoutEnum.only:
                await createRevokeToken(req.decoded as JwtPayload);
                statusCode = 201;
                break;

            default:
                break;

            
        }

        await this._userModel.updateOne({
            filter : { 
                _id: req.decoded?.id,
            },
            update,
            
        })


        return res.status(statusCode).json({message : "User Logged Out"  });
        
    };

    refreshToken = async (req:Request, res:Response, next: NextFunction): Promise<Response> =>{

        const credentials = await createLoginCredentials(req.user as HUserDocument)
        await createRevokeToken(req.decoded as JwtPayload);

        return res.status(200).json({message: "Token Refreshed" , data: credentials})
    }
}

export default new UserService(); 