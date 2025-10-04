import { Request, Response } from "express";
import { ISignupDTO } from "./auth.dto";
import { UserModel } from "../../DB/models/user.model";
import { BadRequestException, ConflictException, NotFoundException } from "../../utils/response/error.response";
import { UserRepository } from "../../DB/repositories/user.repository";
import { compareHash, generateHash } from "../../utils/security/hash";
import { emailEvent } from "../../utils/events/email.event";
import { generateOTP } from "../../utils/generateOTP";
import { createLoginCredentials } from "../../utils/security/token";
import { createPreSignedUrl, uploadFiles } from "../../utils/multer/s3.config";
import { storageEnum } from "../../utils/multer/cloud.multer";




class AuthenticationService {

    private _userModel = new UserRepository(UserModel);

    constructor() { }

    signup = async (req: Request, res: Response): Promise<Response> => {

        const { username, email, password }: ISignupDTO = req.body;

        const checkUser = await this._userModel.findOne({
            filter: { email },
            options: { lean: true }
        });
        if (checkUser)
            throw new ConflictException("User already exists!!!");

        const otp = generateOTP();
        const user = await this._userModel.createUser({
            data: [{
                username,
                email,
                password: await generateHash(password),
                confirmEmailOTP: await generateHash(otp.toString()),
            }],
            options: { validateBeforeSave: true },
        });

        emailEvent.emit("confirmEmail", { to: email, username, otp })


        return res.status(201).json({ message: "User created successfully ", user });
    }

    login = async (req: Request, res: Response): Promise<Response> => {

        const { email, password } = req.body;
        const user = await this._userModel.findOne({
            filter: { email },
        });
        if (!user)
            throw new NotFoundException("Nor found account");

        if (!compareHash(password, user?.password))
            throw new BadRequestException("Invalid credentials");

        const credentials = await createLoginCredentials(user);


        return res.status(200).json({ message: "User Logged In successfully ", credentials });
    }

    confirmEmail = async (req: Request, res: Response): Promise<Response> => {

        const { email, otp } = req.body;

        const user = await this._userModel.findOne({
            filter: {
                email,
                confirmEmailOTP: { $exists: true },
                confirmedAt: { $exists: false }
            }
        });

        if (!user) throw new NotFoundException("Invalid Account ")

        if (!compareHash(otp, user?.confirmEmailOTP))
            throw new BadRequestException("Invalid OTP ")


        await this._userModel.updateOne({
            filter: { email },
            update: {
                confirmedAt: Date.now(),
                $unset: { confirmEmailOTP: true },
            },
        });


        return res.status(200).json({ message: " User confirmed successfully " })
    }

    profileImage = async (req: Request, res: Response): Promise<Response> => {

        // const key = await uploadFile({
        //     file : req.file as Express.Multer.File ,
        //     path : `users/${req.decoded?._id}`,
        // })

        // const key = await uploadLargeFile({
        //     file : req.file as Express.Multer.File ,
        //     path : `users/${req.decoded?._id}`,
        // })

        const { ContentType, originalName }: { ContentType: string; originalName: string; } = req.body;
        const { url, Key } = await createPreSignedUrl({ ContentType, originalName, path: `users/${req.decoded?._id}` })


        return res.status(200).json({ message: " profile Image uploaded successfully ", url, Key })
    }

    coverImages = async (req: Request, res: Response): Promise<Response> => {

        const urls = await uploadFiles({
            storageApproach: storageEnum.DISK,
            files: req.files as Express.Multer.File[],
            path: `users/${req.decoded?._id}/coverImages`,
        })


        return res.status(200).json({ message: " profile Image uploaded successfully ", urls })
    }


}

export default new AuthenticationService(); 