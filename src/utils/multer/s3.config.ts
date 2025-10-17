import {  DeleteObjectCommand, DeleteObjectCommandOutput, DeleteObjectsCommand, GetObjectCommand, GetObjectCommandOutput, ObjectCannedACL , PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { storageEnum } from "./cloud.multer";
import {v4 as uuid} from "uuid";
import { createReadStream } from "node:fs";
import { BadRequestException } from "../response/error.response";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";


export const s3Config = () => {

    return new S3Client({
        region: process.env.REGION as string ,
        credentials:{
            accessKeyId:process.env.AWS_ACCESS_KEY_ID as string,
            secretAccessKey:process.env.AWS_SECRET_ACCESS_KEY as string,
        },
    })
};


export const uploadFile =  async ({
    storageApproach = storageEnum.MEMORY,
    Bucket = process.env.AWS_BUCKET_NAME as string,
    ACL = "private" ,
    path ="General", 
    file,
}:{
    storageApproach?:storageEnum;
    Bucket?:string;
    ACL?:ObjectCannedACL;
    path?: string;
    file:Express.Multer.File;
}): Promise<string> => {

    const command = new PutObjectCommand({
        
        Bucket,
        ACL,
        Key : `${process.env.APP_NAME}/${path}/${uuid()}-${file.originalname}`,
        Body: storageApproach === storageEnum.MEMORY ? file.buffer : createReadStream(file.path) ,
        ContentType : file.mimetype,
    });


    await s3Config().send(command);


    if(!command?.input?.Key)
        throw new BadRequestException("failed to upload the file");


    return command.input.Key;
}


export const uploadLargeFile =  async ({
    storageApproach = storageEnum.MEMORY,
    Bucket = process.env.AWS_BUCKET_NAME as string,
    ACL = "private" ,
    path ="General", 
    file,
}:{
    storageApproach?:storageEnum;
    Bucket?:string;
    ACL?:ObjectCannedACL;
    path?: string;
    file:Express.Multer.File;
}): Promise<string> => {

    const upload = new Upload({

        client : s3Config(),
        params : {
            Bucket ,
            ACL ,
            Key : `${process.env.APP_NAME}/${path}/${uuid()}-${file.originalname}`, 
            Body: storageApproach === storageEnum.MEMORY ? file.buffer : createReadStream(file.path),
            ContentType : file.mimetype,
        },
    });

    upload.on("httpUploadProgress" , (progress) =>{
        console.log("Upload progress" , progress);

        
    })

   const {Key} =  await upload.done();
   if(!Key)
    throw new BadRequestException("Failed to upload the large file");

   return Key;
}

export const uploadFiles = async ({
    storageApproach = storageEnum.MEMORY,
    Bucket = process.env.AWS_BUCKET_NAME as string,
    ACL = "private" ,
    path ="General", 
    files,
}:{
    storageApproach?:storageEnum;
    Bucket?:string;
    ACL?:ObjectCannedACL;
    path?: string;
    files: Express.Multer.File[];
}): Promise<string[]> => {

    let urls:string[] = [];
    urls = await Promise.all(
        files.map((file) =>{  return uploadFile({ storageApproach, Bucket, ACL, path, file })
    })
);
    return urls;

}


export const createPreSignedUrl = async ({
    Bucket = process.env.AWS_BUCKET_NAME as string,
    path = "General",
    ContentType ,
    originalName ,
    expiresIn = 120
}:{
    Bucket?: string;
    path?: string;
    ContentType: string;
    originalName: string;
    expiresIn?: number;
}):Promise<{url:string ; Key : string}>  => {

    const command = new PutObjectCommand({
        Bucket,
        Key : `${process.env.APP_NAME}/${path}/${uuid()}-preSigned-${originalName}`,
        ContentType
    });
    const url = await getSignedUrl(s3Config(), command , { expiresIn });

    if(!url || !command?.input?.Key)
        throw new BadRequestException("Failed to generate the preSigned Url")

    return { url , Key: command.input.Key};
};


export const createGetPresignedUrl = async ({
    Bucket = process.env.AWS_BUCKET_NAME as string,
    Key , 
    downloadName,
    download="false",
    expiresIn = 120
}:{
    Bucket?: string;
    Key:string;
    downloadName?:string;
    download?: string;
    expiresIn?: number;
})  => {

   const command = await new GetObjectCommand({
    Bucket ,
    Key,
    ResponseContentDisposition: download === "true" ? `attachment; filename=${downloadName }` : undefined,
   })
   const url = await getSignedUrl(s3Config(), command , {expiresIn})

   if(!url)
    throw new BadRequestException("Failed to generate PreSigned Get Url");
   return url ;
};

export const getFile = async ({

    Bucket = process.env.AWS_BUCKET_NAME as string,
    Key

}:{
    Bucket?:string;
    Key:string;

}):Promise<GetObjectCommandOutput>  => {

   const command = new GetObjectCommand({
    Bucket , 
    Key
   })
   return await s3Config().send(command);

}

export const deleteFile = async ({

    Bucket = process.env.AWS_BUCKET_NAME as string,
    Key,

}:{
    Bucket?:string;
    Key:string;

}):Promise<DeleteObjectCommandOutput>  => {

   const command = new DeleteObjectCommand({
    Bucket , 
    Key , 
   })

   return await s3Config().send(command);

}


export const deleteFiles = async ({

    Bucket = process.env.AWS_BUCKET_NAME as string,
    urls,
    Quiet = false,

}:{
    Bucket?:string;
    urls:string[];
    Quiet?:boolean;

}):Promise<DeleteObjectCommandOutput>  => {

    const Objects = urls.map((url) => {
        return {Key : url};
    })

   const command = new DeleteObjectsCommand({
    Bucket , 
    Delete : {
        Objects,
        Quiet
    } 
   })
   console.log("Deleting from S3:", Objects.map(o => o.Key));

const response = await s3Config().send(command);
console.log("S3 delete response:", response);
return response;
   return await s3Config().send(command);

}



