import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { User, userSchema } from "../../model/user.model.js";
import { UserController } from "./user.controller.js";
import { UserService } from "./user.service.js";
import { UserRepo } from "../../repo/user.repo.js";
import { S3BucketService } from "../../services/s3Bucket.service.js";
import { SecurityService } from "../../securityService.js";
import { AuthGuard } from "../../common/Guards/authentication.guard.js";
import { RolesGuard } from "../../common/Guards/authorization.guard.js";
import { TokenService } from "../../services/token.services.js";
import { RedisModule } from "../../services/reids.module.js";

@Module({
    imports:[
        MongooseModule.forFeature([{
            name:User.name,
            schema:userSchema,
        }]),
        RedisModule,
    ],
    controllers:[UserController],
    providers:[UserService, UserRepo, S3BucketService, SecurityService, AuthGuard, RolesGuard, TokenService],
})
export class UserModule{}
