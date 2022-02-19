import jwt from 'jsonwebtoken'
import { IUserModel } from '../models/User';
import Locals from './Locals';
import { Request } from 'express';
class JWT{
    public static issueJWT(user: IUserModel): {token: string, expires: number}{
        const expiresIn=Locals.config().jwtExpiresIn
        const payload = {
            sub: user._id,
            iat: Date.now(),
        };
        const signedToken = jwt.sign(payload, Locals.config().jwtSecretKey, {expiresIn});
        return {
            // This is Bearer Token
            token: signedToken,
            expires: expiresIn,
        };
    }
    public static getToken(req: Request): string {
        if (req.headers.authorization &&req.headers.authorization.split(" ")[0] === "Bearer") {
          return req.headers.authorization.split(" ")[1];
        }
        return '';
    }
}
export default JWT