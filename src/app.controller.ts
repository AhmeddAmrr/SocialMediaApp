import express from "express";
import path from "node:path";
import type { Express, Request, Response } from "express";
import { config } from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit, { type RateLimitRequestHandler } from "express-rate-limit";
import authRouter from "./Modules/Auth/auth.controller";
import userRouter from "./Modules/User/user.controller";
import { BadRequestException, globalErrorHandler } from "./utils/response/error.response";
import connectDB from "./DB/connection";
import { createGetPresignedUrl, getFile } from "./utils/multer/s3.config";
import { promisify } from "node:util";
import { pipeline } from "node:stream";
import { UserModel } from "./DB/models/user.model";
import { UserRepository } from "./DB/repositories/user.repository";
config({ path: path.resolve("./config/.env.dev") });

const createS3WriteStreamPipe = promisify(pipeline)


const limiter: RateLimitRequestHandler = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    message: {
        status: 429,
        message: "Too many requests from this IP , please try again later"
    }
})

export const bootstrap = async (): Promise<void> => {
    const app: Express = express();
    const port: number | string = process.env.PORT || 5000;

    app.use(cors(), express.json(), helmet(), limiter); // global middlewares
    await connectDB();

    app.get('/users', (req: Request, res: Response) => {
        return res.status(200).json({ message: "Hello from express and ts USERS" });
    });

    app.use("/api/auth", authRouter);
    app.use("/api/user", userRouter);

    // app.get("/test" , async (req:Request , res:Response) =>{

    //     const results = await deleteFiles({
    //         urls : [
    //             "SOCIAL MEDIA APP/users/68cdcae65cf27e06f43b4cb7/14c99734-e425-43b6-9353-b3fd2b1050ab-preSigned-seifPic.jpg",
    //             "SOCIAL MEDIA APP/users/68cdcae65cf27e06f43b4cb7/e2b11f0e-5cc3-483b-9c1b-1b63ff1c1ae0-preSigned-ahmedPic.jpg",
    //         ]
    //     })
    //     return res.status(200).json({ message:"SUCCESS" , results});

    // });
    // app.get("/test-s3", async (req:Request , res:Response) =>{
    //     const {Key} = req.query as {Key:string};

    //     const results = await deleteFile({  Key : Key as string });
    //     return res.status(200).json({ message:"SUCCESS" , results});
    // });

    app.get("/upload/pre-signed/*path", async (req: Request, res: Response) => {
        const { downloadName, download } = req.query as { downloadName?: string; download?: string; };
        const { path } = req.params as unknown as { path: string[] };

        const Key = path.join("/");
        const url = await createGetPresignedUrl({
            Key,
            downloadName: downloadName as string,
            download: download as string,
        })
        return res.status(200).json({ message: "SUCCESS", url });

    })
    app.get("/upload/*path", async (req: Request, res: Response) => {
        const { downloadName } = req.query;
        const { path } = req.params as unknown as { path: string[] };
        const Key = path.join("/");
        const s3Response = await getFile({ Key })
        if (!s3Response?.Body)
            throw new BadRequestException("Failed to get Asset")

        res.setHeader("Content-Type", `${s3Response.ContentType}` || "application/octet-stream");
        if (downloadName) {
            res.setHeader("Content-Disposition", `attachment; filename=${downloadName}`)
        }

        return await createS3WriteStreamPipe(
            s3Response.Body as NodeJS.ReadableStream,
            res
        )


    })

    app.use(globalErrorHandler)
    async function user() {
        try {

            const userModel = new UserRepository(UserModel);
            const user = await userModel.findOneAndUpdate({
                filter: { _id: "68cdcae65cf27e06f43b4cb7" },
                update: { freezedAt: new Date() },
            })
            console.log({ results: user });




        } catch (error) {
            console.log(error);

        }
    }
    user();

    app.listen(port, (): void => {
        console.log(`Server is running on PORT : ${port}`);
    });
}