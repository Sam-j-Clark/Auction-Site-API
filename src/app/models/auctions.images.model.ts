import Logger from "../../config/logger";
import fs from "mz/fs";
import {ImageAndInfo} from "../app_types";
import {getPool} from "../../config/db";
import path from "path";

const STORAGE_DIRECTORY: string = "storage/images/";
const VALID_EXTENSIONS: string[] = [".jpg", ".png", ".gif"]

const getAuctionImagepath = async (auctionId: number): Promise<string> => {
    Logger.info(`Getting the hero image for auction ${auctionId}`);
    const conn = await getPool().getConnection();
    const query = `SELECT image_filename FROM auction WHERE id = ?`;
    const [ result ] = await conn.query(query, [ auctionId ]);
    conn.release();

    if (result.length === 0 || result[0].image_filename == null) {
        Logger.info(`No image exists for auction: ${auctionId}`);
        return null;
    }
    try {
        return path.resolve(STORAGE_DIRECTORY, result[0].image_filename);
    } catch (err) {
        Logger.error(err + result)
    }

}

const setAuctionImage = async (auctionId: number, image: ImageAndInfo): Promise<void> => {
    Logger.info(`Setting the hero image for auction: ${auctionId}`);
    let imageName: string = "auction_" + auctionId;
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
    Logger.info(`Setting auction hero image for ${auctionId} to ${imageName}`);

    const conn = await getPool().getConnection();
    const query = `UPDATE auction SET image_filename = ? WHERE id = ?`;
    await conn.query(query, [ imageName, auctionId ]);
    conn.release();
    return null;
}

const deleteImageIfExists = async (auctionId: number): Promise<boolean> => {
    Logger.info(`Deleting hero image for auction ${auctionId} if one exists`);
    for (const extension of VALID_EXTENSIONS) {
        const imageName: string = "auction_" + auctionId + extension;
        if ( await fs.exists(STORAGE_DIRECTORY + imageName)) {
            await fs.rmSync(STORAGE_DIRECTORY + imageName);
            return true;
        }
    }
    return false;
}

export { getAuctionImagepath, setAuctionImage, deleteImageIfExists }