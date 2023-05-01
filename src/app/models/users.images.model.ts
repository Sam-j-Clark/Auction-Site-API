import Logger from "../../config/logger";
import {getPool} from "../../config/db";
import path from "path";
import {ImageAndInfo} from "../app_types";
import fs from "mz/fs";

const STORAGE_DIRECTORY: string = "storage/images/";
const VALID_EXTENSIONS: string[] = [".jpg", ".png", ".gif"];




const getUserProfileImagepath = async (userId: number): Promise<string> => {
    Logger.info(`Getting the user profile image for user ${userId}`);
    const conn = await getPool().getConnection();
    const query = `SELECT image_filename FROM user WHERE id = ?`;
    const [ result ] = await conn.query(query, [ userId ]);
    conn.release();
    if (result.length === 0 || result[0].image_filename == null) {
        Logger.info(`No image exists for auction: ${userId}`);
        return null;
    }
    return path.resolve(STORAGE_DIRECTORY, result[0].image_filename);
}




const uploadUserPhoto = async (userId: number, image: ImageAndInfo): Promise<boolean> => {
    Logger.info(`Setting the user image for user: ${userId}`);
    let imageName: string = "auction_" + userId;
    if (image.contentType === "image/jpeg") {
        imageName += ".jpg";
    }
    if (image.contentType === "image/png") {
        imageName += ".png";
    }
    if (image.contentType === "image/gif") {
        imageName += ".gif";
    }
    await fs.writeFile(STORAGE_DIRECTORY + imageName, image.imageBytes)
    Logger.info(`Setting auction profile image for ${userId} to ${imageName}`);

    const conn = await getPool().getConnection();
    const query = `UPDATE user SET image_filename = ? WHERE id = ?`;
    await conn.query(query, [ imageName, userId ]);
    conn.release();
    return null;
}




const deleteImage = async (userId: number): Promise<void> => {
    Logger.info(`Deleting profile image for user ${userId} if one exists`);
    for (const extension of VALID_EXTENSIONS) {
        const imageName: string = "auction_" + userId + extension;
        if ( await fs.exists(STORAGE_DIRECTORY + imageName)) {
            await fs.rmSync(STORAGE_DIRECTORY + imageName);
        }
    }
    const conn = await getPool().getConnection();
    const query = `UPDATE user SET image_filename = NULL WHERE id = ?`;
    await conn.query(query, [ userId ]);
    conn.release();
    return null;
}


export { getUserProfileImagepath, uploadUserPhoto, deleteImage }