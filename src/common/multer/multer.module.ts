import { Global, Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { allowedFileFormats, multerOptions } from "./multer.config.js";
import { StorageApproachEnum } from "../enums/multer.enum.js";


@Global()
@Module({
  imports: [
    MulterModule.registerAsync({
      useFactory: () =>
        multerOptions({
          allowedFormat: allowedFileFormats.image,
          storageApproach: StorageApproachEnum.MEMORY,
          fileSize: 5,
        }),
    }),
  ],
  exports: [MulterModule],
})
export class CustomMulterModule {}
