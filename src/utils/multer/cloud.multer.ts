import { Request } from "express";
import multer, { FileFilterCallback, Multer } from "multer";
import os from "node:os";
import {v4 as uuid} from "uuid";
import { BadRequestException } from "../response/error.response";

export enum storageEnum {
    MEMORY = "MEMORY",
    DISK = "DISK",
}


export const fileValidation = {
    image : ["image/jpg" , "image/jpeg" , "image/png" , "image/gif"],
    pdf: ["application/pdf"],
    videos: ["video/mov" , "video/mp4" , "video/avi" , "video/wmv" , "video/flv" , "video/webm"],

}

export const cloudFileUpload =  (
    {
        validation =[],
        storageApproach = storageEnum.MEMORY,
        maxSize = 2,
    }:{
        validation?: string[] ;
        storageApproach? : storageEnum;
        maxSize?: number ; 
    }
    ):Multer =>{

    const storage = storageApproach === storageEnum.MEMORY
     ? multer.memoryStorage() 
     : multer.diskStorage({
        destination: os.tmpdir(),
        filename: (req:Request , file: Express.Multer.File , cb) =>{
            cb(null , `${uuid()}-${file.originalname}`)
        },
     });

     function fileFilter ( req:Request , file:Express.Multer.File , cb: FileFilterCallback ){
        if(!validation.includes(file.mimetype)){
            return cb( new BadRequestException("Invalid file format"));
        }
        return cb(null , true )
     }


    return multer ({
        fileFilter,
        limits: { fileSize : maxSize * 1024 * 1024},
        storage
    })
}