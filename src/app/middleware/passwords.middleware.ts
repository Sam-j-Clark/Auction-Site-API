import Logger from "../../config/logger";
import * as bcrypt from "bcrypt";
import {User} from "../app_types";

const hash = async (password: string): Promise<string> => {
    try {
        return await bcrypt.hash(password, await bcrypt.genSalt(10))
    } catch ( err ) {
        Logger.error(err);
        return;
    }
};

const authenticateUser = async (user: User, passwordAttempt: string): Promise<boolean> => {
    return bcrypt.compareSync(passwordAttempt, user.password);
}

export { hash, authenticateUser };