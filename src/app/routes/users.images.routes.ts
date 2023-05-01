import { Express } from "express";
import {rootUrl} from "./base.routes";
import { loginRequired } from "../middleware/users.middleware";

import * as usersImages from "../controllers/users.images.controller";
import {header, param} from "express-validator";
import {handleValidation} from "../middleware/validation.middleware";

module.exports  = (app: Express) => {

    app.route(rootUrl + "/users/:id/image")
        .get(param("id").isInt({min : 1}),
            handleValidation(),
            usersImages.getImage)
        .put(loginRequired(),
            param("id").isInt({min : 1}),
            header("Content-Type").isIn(["image/gif",
                "image/jpeg",
                "image/png"]),
            handleValidation(),
            usersImages.uploadImage)
        .delete(loginRequired(),
            param("id").isInt({min : 1}),
            handleValidation(),
            usersImages.deleteImage);
}