import {Request, Response} from "express";
import Logger from "../../config/logger";
import {reqToCreateAuctionRequest, reqToUpdateRequest, reqToAuctionListRequest} from "../middleware/schemaConvserion.middleware";
import * as auctionsModel from "../models/auctions.model";
import {AuctionDetails, AuctionListRequest, AuctionOverview, Category, User} from "../app_types";
import {getUserByID} from "../models/users.model";
import {getCategoryById} from "../models/auctions.model";



const newAuction = async (req: Request, res:Response): Promise<any> => {
    Logger.http(`POST creating new auction for: ${req.body.title}`);
    try {
        const auctionRequest: AuctionDetails = await reqToCreateAuctionRequest(req, res.locals.user);
        if (auctionRequest.categoryId == null) {
            res.statusMessage = "Bad Request: categoryId does not match any existing category";
            res.status(400);
            return res.send();
        }
        if (await auctionsModel.auctionExistsWithTitle(req.body.title, auctionRequest.sellerId)) {
            res.statusMessage = "Auction title must be unique"
            res.status(403).send();
            return;
        }
        const result = await auctionsModel.addAuction(auctionRequest);
        res.status(201).json({auctionId: result.insertId});
    } catch (err) {
        Logger.error(err);
        res.status(500).send();
    }
}



const getAuctionsList = async (req: Request, res:Response): Promise<any> => {
    Logger.http(`GET getting a list of auctions`);
    try {
        const auctionsRequest: AuctionListRequest = await reqToAuctionListRequest(req, res);
        if (auctionsRequest == null) return; // invalid field so bad request was returned.
        for (const categoryId of auctionsRequest.categoryIds) {
            if (await getCategoryById(categoryId) == null) {
                res.statusMessage = "Bad Request: one or more invalid category IDs";
                res.status(400).send();
                return;
            }
        }
        let returnList: AuctionOverview[] = [];
        const results = await auctionsModel.getAuctionsList(auctionsRequest);
        for (const auction of results) {
            let valid: boolean = true;
            if (auctionsRequest.categoryIds.length > 0) {
                if (! auctionsRequest.categoryIds.includes(auction.categoryId)) {
                    valid = false;
                }
            }
            if (valid && auctionsRequest.sellerId != null && ! (auction.sellerId === auctionsRequest.sellerId)) {
                valid = false;
            }
            if (auctionsRequest.bidderId != null && ! await auctionsModel.auctionHasBidder(auction.auctionId, auctionsRequest.bidderId)) {
                valid = false;
            }
            if (valid) {
                auction.numBids = await auctionsModel.getCountOfBids(auction.auctionId);
                auction.highestBid = await auctionsModel.getHighestBid(auction.auctionId);
                returnList.push(auction);
            }
        }
        const count: number = returnList.length;
        if (auctionsRequest.count == null) {
            returnList = returnList.slice(auctionsRequest.startIndex);
        } else {
            returnList = returnList.slice(auctionsRequest.startIndex, auctionsRequest.startIndex + auctionsRequest.count);
        }
        res.status(200).json({"auctions": returnList, "count": count});
    } catch (err) {
        Logger.error(err);
        res.status(500).send();
    }
}



const getAuction = async (req: Request, res:Response): Promise<void> => {
    Logger.http(`GET getting auction with id: ${req.params.id}`);
    try {
        const auctionId: number = parseInt(req.params.id, 10);
        const auctionDetails: AuctionDetails = await auctionsModel.getAuctionById(auctionId);
        // No auction found so no more details needed.
        if (auctionDetails == null) {
            res.status(404).send();
            return;
        }
        const seller: User = await getUserByID(auctionDetails.sellerId);
        const highestBid: number = await auctionsModel.getHighestBid(auctionId);
        const numBids: number = await auctionsModel.getCountOfBids(auctionId);
        res.status(200).json({
            auctionId,
            title: auctionDetails.title,
            categoryId: auctionDetails.categoryId,
            sellerId: auctionDetails.sellerId,
            sellerFirstName: seller.firstName,
            sellerLastName: seller.lastName,
            reserve: auctionDetails.reserve,
            numBids,
            highestBid,
            endDate: auctionDetails.endDate,
            description: auctionDetails.description
        })

    } catch (err) {
        Logger.error(err);
        res.status(500).send();
    }
}

const updateAuction = async (req: Request, res:Response): Promise<void> => {
    Logger.http(`PATCH update auction with id: ${req.params.id}`);
    try {
        const auctionId: number = parseInt(req.params.id, 10);
        const auctionDetails: AuctionDetails = await auctionsModel.getAuctionById(auctionId);
        // No auction found (404))
        if (auctionDetails == null) {
            res.status(404).send();
            return;
        }
        const seller: User = await getUserByID(auctionDetails.sellerId);
        if (seller.userId !== res.locals.user.userId) {
            res.status(403).send();
            return;
        }
        const numBids: number = await auctionsModel.getCountOfBids(auctionId);
        if (numBids > 0) {
            res.statusMessage = "Cannot change an auction with bids";
            res.status(403).send();
            return;
        }
        if (req.body.hasOwnProperty("title")) {
            if (await auctionsModel.auctionExistsWithTitle(req.body.title, seller.userId, auctionId)) {
                res.statusMessage = "Auction title must be unique"
                res.status(403).send();
                return;
            }
        }
        // Change the fields ready for request.
        const newDetails: AuctionDetails = await reqToUpdateRequest(req, res, auctionDetails);
        if (newDetails == null) {
            res.status(400).send();
            return;
        }
        await auctionsModel.updateAuctionDetails(auctionId, auctionDetails)
        res.status(200).send();
    } catch (err) {
        Logger.error(err);
        res.status(500).send();
    }
}

const deleteAuction = async (req: Request, res:Response): Promise<void> => {
    Logger.http(`DELETE attempt delete of auction: ${req.params.id}`);
    try {
        const auctionId: number = parseInt(req.params.id, 10);
        const auctionDetails: AuctionDetails = await auctionsModel.getAuctionById(auctionId);
        // No auction found (404))
        if (auctionDetails == null) {
            res.status(404).send();
            return;
        }
        // Check the seller is the current user else (403)
        const seller: User = await getUserByID(auctionDetails.sellerId);
        if (seller.userId !== res.locals.user.userId) {
            res.status(403).send();
            return;
        }
        const numBids: number = await auctionsModel.getCountOfBids(auctionId);
        if (numBids > 0) {
            res.statusMessage = "Cannot delete an auction with bids";
            res.status(403).send();
            return;
        }
        await auctionsModel.deleteAuctionById(auctionId);
        res.status(200).send();

    } catch (err) {
        Logger.error(err);
        res.status(500).send();
    }
}

const getAuctionCategories = async (req: Request, res:Response): Promise<void> => {
    Logger.http(`GET list auction categories`);
    try {
        const categories: Category[] = await auctionsModel.getCategoriesList();
        res.status(200).json(categories);
        return null;
    } catch (err) {
        Logger.error(err);
        res.status(500).send();
    }
}


export { newAuction, getAuctionsList, updateAuction, getAuction, deleteAuction, getAuctionCategories };