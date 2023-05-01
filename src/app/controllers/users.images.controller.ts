import {Request, Response} from "express";
import Logger from "../../config/logger";
import { ImageAndInfo, User } from "../app_types";
import {getUserByID} from "../models/users.model";
import * as userImagesModel from "../models/users.images.model";


const getImage = async (req: Request, res: Response): Promise<any> => {
    Logger.http(`GET retrieving the user profile image of user ${req.params.id}`);
    try {
        const userId: number = parseInt(req.params.id, 10);
        const user: User = await getUserByID(userId);
        if (user == null) {
            res.status(404).send();
            return null;
        }
        const imageFilePath: string = await userImagesModel.getUserProfileImagepath(userId);
        if (imageFilePath == null) {
            res.status(404).send();
            return null;
        }
        Logger.info("sending filepath: " + imageFilePath);
        res.status(200).sendFile(imageFilePath);
        return null;
    } catch (err) {
        Logger.error(err);
        res.status(500).send();
    }
}

const uploadImage = async (req: Request, res: Response): Promise<any> => {
    Logger.http('PUT updating or adding profile image for ' + req.params.id);
    try {
        const userId: number = parseInt(req.params.id, 10);
        const user: User = await getUserByID(userId);
        if (user == null) {
            res.status(404).send();
            return null;
        }
        if (user.userId !== res.locals.user.userId) { // Not the current users
            res.status(403).send();
            return null;
        }
        const imageInfo: ImageAndInfo = {imageBytes: req.body, contentType: req.header("Content-Type")}
        const existed: boolean = (await userImagesModel.getUserProfileImagepath(userId)) != null;
        await userImagesModel.deleteImage(userId);
        await userImagesModel.uploadUserPhoto(userId, imageInfo);
        res.status(existed ? 200 : 201);
        res.send();
        return null;
    } catch (err) {
        Logger.error(err);
        res.status(500).send();
    }
}

const deleteImage = async (req: Request, res: Response): Promise<any> => {
    Logger.http(`DELETE removing the profile image for user ${req.params.id}`);
    const userId: number = parseInt(req.params.id, 10);
    const user: User = await getUserByID(userId);
    if (user == null) {
        res.status(404).send();
        return null;
    }
    if (user.userId !== res.locals.user.userId) { // Not the current users
        res.status(403).send();
        return null;
    }
    await userImagesModel.deleteImage(userId);
    res.status(200).send();
}

export { getImage, uploadImage, deleteImage };