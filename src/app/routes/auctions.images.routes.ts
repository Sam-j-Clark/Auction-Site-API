import { Express } from "express";
import {rootUrl} from "./base.routes";
import { loginRequired } from "../middleware/users.middleware";
import { handleValidation } from "../middleware/validation.middleware";
import {param, header} from 'express-validator';

import * as auctionImages from "../controllers/auctions.images.controller";

module.exports = (app: Express) => {

    app.route(rootUrl + "/auctions/:id/image")

        .put(loginRequired(),
            param("id").isInt({min : 1}),
            header("Content-Type").isIn(["image/gif",
                                                "image/jpeg",
                                                "image/png"]),
            handleValidation(),
            auctionImages.uploadAuctionImage)

        .get(param("id").isInt({min : 1}),
            handleValidation(),
            auctionImages.getAuctionImage);
};