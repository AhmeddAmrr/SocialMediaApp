"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFiles = exports.deleteFile = exports.getFile = exports.createGetPresignedUrl = exports.createPreSignedUrl = exports.uploadFiles = exports.uploadLargeFile = exports.uploadFile = exports.s3Config = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const cloud_multer_1 = require("./cloud.multer");
const uuid_1 = require("uuid");
const node_fs_1 = require("node:fs");
const error_response_1 = require("../response/error.response");
const lib_storage_1 = require("@aws-sdk/lib-storage");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const s3Config = () => {
    return new client_s3_1.S3Client({
        region: process.env.REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
    });
};
exports.s3Config = s3Config;
const uploadFile = async ({ storageApproach = cloud_multer_1.storageEnum.MEMORY, Bucket = process.env.AWS_BUCKET_NAME, ACL = "private", path = "General", file, }) => {
    const command = new client_s3_1.PutObjectCommand({
        Bucket,
        ACL,
        Key: `${process.env.APP_NAME}/${path}/${(0, uuid_1.v4)()}-${file.originalname}`,
        Body: storageApproach === cloud_multer_1.storageEnum.MEMORY ? file.buffer : (0, node_fs_1.createReadStream)(file.path),
        ContentType: file.mimetype,
    });
    await (0, exports.s3Config)().send(command);
    if (!command?.input?.Key)
        throw new error_response_1.BadRequestException("failed to upload the file");
    return command.input.Key;
};
exports.uploadFile = uploadFile;
const uploadLargeFile = async ({ storageApproach = cloud_multer_1.storageEnum.MEMORY, Bucket = process.env.AWS_BUCKET_NAME, ACL = "private", path = "General", file, }) => {
    const upload = new lib_storage_1.Upload({
        client: (0, exports.s3Config)(),
        params: {
            Bucket,
            ACL,
            Key: `${process.env.APP_NAME}/${path}/${(0, uuid_1.v4)()}-${file.originalname}`,
            Body: storageApproach === cloud_multer_1.storageEnum.MEMORY ? file.buffer : (0, node_fs_1.createReadStream)(file.path),
            ContentType: file.mimetype,
        },
    });
    upload.on("httpUploadProgress", (progress) => {
        console.log("Upload progress", progress);
    });
    const { Key } = await upload.done();
    if (!Key)
        throw new error_response_1.BadRequestException("Failed to upload the large file");
    return Key;
};
exports.uploadLargeFile = uploadLargeFile;
const uploadFiles = async ({ storageApproach = cloud_multer_1.storageEnum.MEMORY, Bucket = process.env.AWS_BUCKET_NAME, ACL = "private", path = "General", files, }) => {
    let urls = [];
    urls = await Promise.all(files.map((file) => {
        return (0, exports.uploadFile)({ storageApproach, Bucket, ACL, path, file });
    }));
    return urls;
};
exports.uploadFiles = uploadFiles;
const createPreSignedUrl = async ({ Bucket = process.env.AWS_BUCKET_NAME, path = "General", ContentType, originalName, expiresIn = 120 }) => {
    const command = new client_s3_1.PutObjectCommand({
        Bucket,
        Key: `${process.env.APP_NAME}/${path}/${(0, uuid_1.v4)()}-preSigned-${originalName}`,
        ContentType
    });
    const url = await (0, s3_request_presigner_1.getSignedUrl)((0, exports.s3Config)(), command, { expiresIn });
    if (!url || !command?.input?.Key)
        throw new error_response_1.BadRequestException("Failed to generate the preSigned Url");
    return { url, Key: command.input.Key };
};
exports.createPreSignedUrl = createPreSignedUrl;
const createGetPresignedUrl = async ({ Bucket = process.env.AWS_BUCKET_NAME, Key, downloadName, download = "false", expiresIn = 120 }) => {
    const command = await new client_s3_1.GetObjectCommand({
        Bucket,
        Key,
        ResponseContentDisposition: download === "true" ? `attachment; filename=${downloadName}` : undefined,
    });
    const url = await (0, s3_request_presigner_1.getSignedUrl)((0, exports.s3Config)(), command, { expiresIn });
    if (!url)
        throw new error_response_1.BadRequestException("Failed to generate PreSigned Get Url");
    return url;
};
exports.createGetPresignedUrl = createGetPresignedUrl;
const getFile = async ({ Bucket = process.env.AWS_BUCKET_NAME, Key }) => {
    const command = new client_s3_1.GetObjectCommand({
        Bucket,
        Key
    });
    return await (0, exports.s3Config)().send(command);
};
exports.getFile = getFile;
const deleteFile = async ({ Bucket = process.env.AWS_BUCKET_NAME, Key, }) => {
    const command = new client_s3_1.DeleteObjectCommand({
        Bucket,
        Key,
    });
    return await (0, exports.s3Config)().send(command);
};
exports.deleteFile = deleteFile;
const deleteFiles = async ({ Bucket = process.env.AWS_BUCKET_NAME, urls, Quiet = false, }) => {
    const Objects = urls.map((url) => {
        return { Key: url };
    });
    const command = new client_s3_1.DeleteObjectsCommand({
        Bucket,
        Delete: {
            Objects,
            Quiet
        }
    });
    console.log("Deleting from S3:", Objects.map(o => o.Key));
    const response = await (0, exports.s3Config)().send(command);
    console.log("S3 delete response:", response);
    return response;
    return await (0, exports.s3Config)().send(command);
};
exports.deleteFiles = deleteFiles;
