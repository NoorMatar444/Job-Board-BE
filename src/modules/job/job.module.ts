import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Job, userSchema as jobSchema } from "../../model/Job.model.js";
import { User, userSchema } from "../../model/user.model.js";
import { JobController } from "./job.controller.js";
import { JobService } from "./job.service.js";
import { JobRepo } from "../../repo/job.repo.js";
import { UserRepo } from "../../repo/user.repo.js";
import { S3BucketService } from "../../services/s3Bucket.service.js";
import { AuthGuard } from "../../common/Guards/authentication.guard.js";
import { RolesGuard } from "../../common/Guards/authorization.guard.js";
import { TokenService } from "../../services/token.services.js";
import { RedisModule } from "../../services/reids.module.js";

@Module({
    imports:[
        MongooseModule.forFeature([
            { name: Job.name, schema: jobSchema },
            { name: User.name, schema: userSchema },
        ]),
        RedisModule,
    ],
    controllers:[JobController],
    providers:[JobService, JobRepo, UserRepo, S3BucketService, AuthGuard, RolesGuard, TokenService],
    exports:[JobService],
})
export class JobModule{}
