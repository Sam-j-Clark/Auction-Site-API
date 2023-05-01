import { getPool } from "../../config/db";
import Logger from "../../config/logger";
import {ResultSetHeader} from "mysql2";
import { rowPacketDataToUser } from "../middleware/schemaConvserion.middleware";
import { generateToken } from "../middleware/users.middleware";
import { User } from "../app_types";


const addUser = async (user: User) : Promise<ResultSetHeader> => {
    Logger.info(`Registering user: ${user.firstName} ${user.lastName} (${user.email})`);
    const conn = await getPool().getConnection();
    const query = `INSERT INTO user (first_name, last_name, email, password) VALUES (?, ?, ?, ?)`;
    const [ result ] = await conn.query(query, [user.firstName, user.lastName, user.email, user.password]);
    conn.release();
    return result;
};

const logout = async (user: User) : Promise<void> => {
    Logger.info(`Logging out user: ${user.userId}`);
    const conn = await getPool().getConnection();
    const query = `UPDATE user SET auth_token = NULL WHERE id = ?`;
    await conn.query(query, [user.userId]);
    conn.release();
    return;
};

const getUser = async () : Promise<any> => {
    return null;
};

const updateUser = async (user: User) : Promise<void> => {
    Logger.info(`Updating user: ${user.userId}`)
    const conn = await getPool().getConnection();
    const query = `UPDATE user
                        SET first_name = ?, last_name = ?, email = ?, image_filename = ?, password = ?
                            WHERE id = ?`;
    await conn.query(query, [user.firstName, user.lastName, user.email, user.imageFilepath, user.password, user.userId]);
    conn.release();
    return null;
};


const addTokenToUser = async (email:string): Promise<string> => {
    Logger.info(`Adding token to user with email: ${email}`)
    const token: string = await generateToken(email);
    const conn = await getPool().getConnection();
    const query = `UPDATE user SET auth_token = ? WHERE user.email = ?`;
    await conn.query(query, [ token, email ]);
    conn.release();
    return (token);
}

const getUserByEmail = async (email: string): Promise<User> => {
    Logger.info(`Checking if user exists with email: ${email}`)
    const conn = await getPool().getConnection();
    const query = `SELECT * FROM user WHERE email = ?`;
    const [ result ] = await conn.query(query, [ email ]);
    conn.release();
    if (result.length === 0) {
        return null;
    }
    return (await rowPacketDataToUser(result[0]));
}

const getUserByToken = async (token: string): Promise<User> => {
    Logger.info(`Getting user by auth token`)
    const conn = await getPool().getConnection();
    const query = `SELECT * FROM user WHERE auth_token = ?`;
    const [ result ] = await conn.query(query, [ token ]);
    conn.release();
    if (result.length === 0) {
        return null;
    }
    return (await rowPacketDataToUser(result[0]));
}

const getUserByID = async (id: number): Promise<User> => {
    Logger.info(`Getting user with id: ${id}`);
    const conn = await getPool().getConnection();
    const query = `SELECT * FROM user WHERE id = ?`;
    const [ result ] = await conn.query(query, [ id ]);
    conn.release();
    if (result.length === 0) {
        return null;
    }
    return (await rowPacketDataToUser(result[0]));
}


export { addUser, logout, getUser, updateUser, getUserByEmail, addTokenToUser, getUserByToken, getUserByID }