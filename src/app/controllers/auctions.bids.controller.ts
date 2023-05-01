import {Request, Response} from "express";
import Logger from "../../config/logger";
import {AuctionDetails, Bid} from "../app_types";
import * as auctionsModel from "../models/auctions.model";


const addBid = async (req: Request, res:Response): Promise<any> => {
    Logger.http(`POST bidding on auction: ${req.params.id}`);
    try {
        const auctionId: number = parseInt(req.params.id, 10);
        const actionDetails: AuctionDetails = await auctionsModel.getAuctionById(auctionId);
        if (actionDetails == null) {
            res.status(404).send();
            return;
        }
        const bidderId: number = parseInt(res.locals.user.userId, 10);
        if (actionDetails.sellerId === bidderId) {
            res.statusMessage = "Cannot bid on your own auction";
            res.status(403).send();
            return;
        }
        const highestBid: number = await auctionsModel.getHighestBid(auctionId);
        const bidAmount: number = parseInt(req.body.amount, 10);
        if (highestBid >= bidAmount ) {
            res.statusMessage = "Bid must be higher than the current highest bid";
            res.status(403).send();
            return;
        }
        await auctionsModel.placeBid(bidderId, auctionId, bidAmount);
        res.status(201).send();
        return null;
    } catch (err) {
        Logger.error(err);
        res.status(500).send();
    }
}

const getBids = async (req: Request, res:Response): Promise<any> => {
    Logger.http(`GET retrieving all bids on auction: ${req.params.id}`);
    try {
        const auctionId: number = parseInt(req.params.id, 10);
        const actionDetails: AuctionDetails = await auctionsModel.getAuctionById(auctionId);
        if (actionDetails == null) {
            res.status(404).send();
            return;
        }
        const bids: Bid[] = await auctionsModel.getBidsById(auctionId);
        res.status(200).json(bids);
        return null;
    } catch (err) {
        Logger.error(err);
        res.status(500).send();
    }
}

export { addBid, getBids }