import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3BucketService {
  private client: S3Client;
  private BucketName: string;
  constructor(configService: ConfigService) {
    ((this.BucketName = configService.getOrThrow<string>('S3_BUCKET_NAME')),
      (this.client = new S3Client({
        region: configService.getOrThrow<string>('Region'),
        credentials: {
          accessKeyId: configService.getOrThrow<string>('AccessKeyId'),
          secretAccessKey: configService.getOrThrow<string>('SecretAccessKey'),
        },
      })));
  }
  async uploadFile({
    file,
    path,
  }: {
    file: Express.Multer.File;
    path: string;
  }) {
    const key=`${path}=${randomUUID()}-${file.originalname}`
    const command = new PutObjectCommand({
      Bucket: this.BucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });
    await this.client.send(command);
    return key;
  }
  async deleteFile({ key }: { key: string | undefined }) {
    const command = new DeleteObjectCommand({
      Bucket: this.BucketName,
      Key: key,
    });
    return await this.client.send(command);
  }
  async presignedUrlUploadFile({
    path,
    originalname,
    contentType,
  }: {
    path: string;
    originalname: string;
    contentType: string;
  }) {
    const key=`${path}=${randomUUID()}-${originalname}`
    const command= new PutObjectCommand({
        Bucket:this.BucketName,
        Key:key,
        ContentType: contentType,
    })
    const url=await getSignedUrl(this.client, command, {expiresIn:3600})
    return {key, url}
  }
  async createPresignedGetFile({ key }: { key: string }) {
  const command = new GetObjectCommand({
    Bucket: this.BucketName,
    Key: key,
  });
  return getSignedUrl(this.client, command, { expiresIn: 3600 });
}
}
