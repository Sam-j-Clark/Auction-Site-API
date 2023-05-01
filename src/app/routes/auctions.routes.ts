import { Express } from "express";
import {rootUrl} from "./base.routes";
import { loginRequired } from "../middleware/users.middleware";
import { handleValidation, checkEndDateInFutureRequired, checkEndDateInFutureOptional } from "../middleware/validation.middleware";
import {body, param, query} from 'express-validator';

import * as auctions from "../controllers/auctions.controller";

module.exports = (app: Express) => {
    app.route(rootUrl + "/auctions")
        .post(loginRequired(),
            body("title").isLength({min : 1}),
            body("description").isLength({min : 1}),
            body("categoryId").isInt( {min : 0}),
            handleValidation(),
            checkEndDateInFutureRequired,
            auctions.newAuction)
        .get(query("startIndex").optional().isInt( {min : 0}),
            query("count").optional().isInt( {min : 0}),
            query("bidderId").optional().isInt( {min : 0}),
            query("sortBy").optional().isIn(["ALPHABETICAL_ASC", "ALPHABETICAL_DESC",
                                                        "BIDS_ASC", "BIDS_DESC",
                                                        "CLOSING_SOON", "CLOSING_LAST",
                                                        "RESERVE_ASC", "RESERVE_DESC"]),
            handleValidation(),
            auctions.getAuctionsList);

    app.route(rootUrl + "/auctions/categories")
        .get(auctions.getAuctionCategories)

    app.route(rootUrl + "/auctions/:id")
        .get(param("id").isInt({min : 1}),
            handleValidation(404),
            auctions.getAuction)
        .patch(loginRequired(),
            param("id").isNumeric(),
            body("title").optional().isLength({min : 1}),
            body("description").optional().isLength({min : 1}),
            body("categoryId").optional().isInt(),
            body("reserve").optional().isInt({min : 1}),
            handleValidation(404),
            checkEndDateInFutureOptional,
            auctions.updateAuction)
        .delete(loginRequired(),
            param("id").isNumeric(),
            handleValidation(404),
            auctions.deleteAuction);
};