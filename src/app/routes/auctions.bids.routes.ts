import {rootUrl} from "./base.routes";
import {Express} from "express";

import * as auctionBids from "../controllers/auctions.bids.controller";
import {body, param} from "express-validator";

import {loginRequired} from "../middleware/users.middleware";
import {handleValidation} from "../middleware/validation.middleware";


module.exports = (app: Express) => {
    app.route(rootUrl + "/auctions/:id/bids")
        .get(param("id").isInt({min : 1}),
            handleValidation(),
            auctionBids.getBids)
        .post(loginRequired(),
            param("id").isNumeric(),
            body("amount").isNumeric(),
            handleValidation(404),
            auctionBids.addBid);
};