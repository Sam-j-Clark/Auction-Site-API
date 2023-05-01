import {RowDataPacket} from "mysql2";
import {User, Category, AuctionDetails, AuctionListRequest} from "../app_types";
import {Request, Response} from "express";
import Logger from "../../config/logger";
import { getCategoryById } from "../models/auctions.model";
import * as auctionsModel from "../models/auctions.model";

const rowPacketDataToUser = async (row: RowDataPacket): Promise<User> => {
    return {
        userId: row.id,
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name,
        password: row.password,
        token: row.auth_token,
        imageFilepath: row.image_filepath,
        currentPassword: null
    };
}

const rowPaketDataToCategory = async (row: RowDataPacket): Promise<Category> => {
    return {
        categoryId: row.id,
        name: row.name
    };
}

const reqToCreateAuctionRequest = async (req: Request, seller: User): Promise<AuctionDetails> => {
    Logger.info("Converting request to CreateAuctionRequest");
    let reservePrice: number = parseInt(req.body.reserve, 10);
    if (isNaN(reservePrice))
        reservePrice = 1;
    const category: Category = await getCategoryById(req.body.categoryId)
    let categoryId: number;
    if (category == null)
        categoryId = null;
    else
        categoryId = category.categoryId;
    return {
        title: req.body.title,
        description: req.body.description,
        categoryId,
        sellerId: seller.userId,
        endDate: req.body.endDate,
        reserve: reservePrice
    };
}

const rowPacketDataToAuction = async (row: RowDataPacket): Promise<AuctionDetails> => {
    return {
        title: row.title,
        description: row.description,
        categoryId:	row.category_id,
        sellerId: row.seller_id,
        endDate: row.end_date,
        reserve: row.reserve
    };
}

const reqToUpdateRequest = async (req: Request, res: Response, existingAuction: AuctionDetails): Promise<AuctionDetails> => {

    // If the categoryId exists but is invalid or missing (400)
    if (req.body.hasOwnProperty("categoryId")) {
        const categoryId: number = parseInt(req.body.categoryId, 10);
        const category: Category = await auctionsModel.getCategoryById(categoryId)
        if (category == null) {
            res.statusMessage = "Bad Request: categoryId does not match any existing category"
            res.status(400).send();
            return null;
        }
        existingAuction.categoryId = categoryId;
    }
    if (req.body.hasOwnProperty("title")) {
        existingAuction.title = req.body.title;
    }
    if (req.body.hasOwnProperty("description")) {
        existingAuction.description = req.body.description;
    }
    if (req.body.hasOwnProperty("endDate")) {
        existingAuction.endDate = req.body.endDate;
    }
    if (req.body.hasOwnProperty("reserve")) {
        const reservePrice: number = parseInt(req.body.reserve, 10);
        if (isNaN(reservePrice)) {
            res.status(400).send();
            return null;
        }
        existingAuction.reserve = reservePrice;
    }
    return existingAuction;
}

const reqToAuctionListRequest = async (req: Request, res: Response): Promise<AuctionListRequest> => {
    try {
        const auctionRequest: AuctionListRequest = req.query;
        auctionRequest.startIndex = req.query.hasOwnProperty("startIndex") ? parseInt(req.query.startIndex as string, 10) : 0;
        auctionRequest.count = req.query.hasOwnProperty("count") ? parseInt(req.query.count as string, 10) : null;
        auctionRequest.regEx = req.query.hasOwnProperty("q") ? "%" + req.query.q as string + "%": "%";
        const categoryIds: number[] = [];
        if (req.query.hasOwnProperty("categoryIds")) {
            // Check if the category id validation doesn't work move it here.
            if (Array.isArray(req.query.categoryIds)) {
                let i: number = 0;
                for (const category of req.query.categoryIds ) {
                    const categoryId: number = parseInt(category as string, 10);
                    if (isNaN(categoryId)) {
                        res.statusMessage = `Bad Request: data.categoryIds[${i}] should be an integer`;
                        res.status(400).send()
                        return null;
                    }
                    if (await auctionsModel.getCategoryById(categoryId) == null) {
                        res.statusMessage = "Bad Request: one or more invalid category IDs"
                        res.status(400).send();
                        return null;
                    }
                    categoryIds.push(categoryId)
                    i++;
                }
            } else {
                const categoryId: number = parseInt(req.query.categoryIds as string, 10)
                if (isNaN(categoryId)) {
                    res.statusMessage = `Bad Request: data.categoryIds[0] should be an integer`;
                    res.status(400).send()
                    return null;
                }
                if (await auctionsModel.getCategoryById(categoryId) == null) {
                    res.statusMessage = "Bad Request: one or more invalid category IDs"
                    res.status(400).send();
                    return null;
                }
                categoryIds.push(categoryId)
            }
        }
        auctionRequest.categoryIds = categoryIds;
        auctionRequest.sellerId = req.query.hasOwnProperty("sellerId") ? parseInt(req.query.sellerId as string, 10) : null;
        auctionRequest.bidderId = req.query.hasOwnProperty("bidderId") ? parseInt(req.query.bidderId as string, 10) : null;
        if (req.query.hasOwnProperty("sortBy")) {
            switch (req.query.sortBy) {
                case ("ALPHABETICAL_ASC"): {
                    auctionRequest.sortBy = "title ASC";
                    break;
                } case ("ALPHABETICAL_DESC"): {
                    auctionRequest.sortBy = "title DESC";
                    break;
                } case ("BIDS_ASC"): {
                    auctionRequest.sortBy = "bids ASC";
                    break;
                } case ("BIDS_DESC"): {
                    auctionRequest.sortBy = "bids ASC";
                    break;
                } case ("CLOSING_SOON"): {
                    auctionRequest.sortBy = "end_date ASC";
                    break;
                } case ("CLOSING_LAST"): {
                    auctionRequest.sortBy = "end_date DESC";
                    break;
                } case ("RESERVE_ASC"): {
                    auctionRequest.sortBy = "reserve ASC";
                    break;
                } case ("RESERVE_DESC"): {
                    auctionRequest.sortBy = "reserve DESC";
                    break;
                } default: {
                    res.statusMessage ="Bad Request: data.sortBy should be equal to one of the allowed values";
                    res.status(400).send();
                    return null;
                }
            }
        } else {
            auctionRequest.sortBy = "end_date ASC";
        }
        return auctionRequest;
    } catch (err) {
        res.status(400).send();
    }
}

export { rowPacketDataToUser, rowPaketDataToCategory, reqToCreateAuctionRequest, rowPacketDataToAuction, reqToUpdateRequest, reqToAuctionListRequest }

