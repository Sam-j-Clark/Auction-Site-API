import {User} from "../app_types";
import {uid} from "rand-token";
import Logger from "../../config/logger";
import {NextFunction, Request, Response} from "express";
import {getUserByToken} from "../models/users.model";

const TOKEN_LENGTH = 32;



const generateToken = async (email: string): Promise<string> => {
    Logger.info(`Generating Json Web Token for: ${email}`)
    return uid(TOKEN_LENGTH);
}


const loginRequired = (strictRequired: boolean = true) => async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    Logger.info(`Validating token for user`);
    const token: string = req.header('X-Authorization');
    const user: User = await getUserByToken(token);
    if (user != null || !strictRequired) {
        res.locals.user = user;
        next();
    } else {
        return res.status(401).send();
    }
}



export { generateToken, loginRequired }