import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as auctionImageModel from "../models/auctions.images.model";
import {AuctionDetails, ImageAndInfo} from "../app_types";
import {getAuctionById} from "../models/auctions.model";

const getAuctionImage = async (req: Request, res: Response): Promise<void> => {
    Logger.http('GET retrieving auction hero image for ' + req.params.id);
    try {
        const auctionId: number = parseInt(req.params.id, 10);
        const auction: AuctionDetails = await getAuctionById(auctionId);
        if (auction == null) {
            res.statusMessage = "Not Found: no such auction"
            res.status(404).send();
            return null;
        }
        const imageFilePath: string = await auctionImageModel.getAuctionImagepath(auctionId);
        if (imageFilePath == null) {
            res.statusMessage = "Not Found: this auction has no hero image"
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

const uploadAuctionImage = async (req: Request, res: Response): Promise<void> => {
    Logger.http('PUT updating or adding auction hero image for ' + req.params.id);
    try {
        const auctionId: number = parseInt(req.params.id, 10);
        const auction: AuctionDetails = await getAuctionById(auctionId);
        if (auction == null) {
            res.status(404).send();
            return null;
        }
        if (auction.sellerId !== res.locals.user.userId) { // Not the current users auction
            res.status(403).send();
            return null;
        }
        const exists: boolean = await auctionImageModel.deleteImageIfExists(auctionId);
        res.status(exists ? 200 : 201);
        const imageInfo: ImageAndInfo = {imageBytes: req.body, contentType: req.header("Content-Type")}
        await auctionImageModel.setAuctionImage(auctionId, imageInfo);
        res.send();
        return null;
    } catch (err) {
        Logger.error(err);
        res.status(500).send();
    }
}

export { uploadAuctionImage, getAuctionImage }