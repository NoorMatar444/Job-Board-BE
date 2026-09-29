import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { HydratedUser } from '../../model/user.model.js';

export interface IAuthRequest extends Request {
  user: HydratedUser;
  verifiedToken: JwtPayload;
}
