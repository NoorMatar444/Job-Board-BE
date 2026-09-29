import { Injectable } from "@nestjs/common";
import { DbRepo } from "./DbRepo.js";
import { Job } from "../model/Job.model.js";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

@Injectable()
export class JobRepo extends DbRepo<Job>{
    constructor(@InjectModel(Job.name) private readonly jobModel:Model<Job>){
        super(jobModel)
    }
}