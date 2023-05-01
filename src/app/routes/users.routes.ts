import { Express } from "express";
import {rootUrl} from "./base.routes";
import { handleValidation } from "../middleware/validation.middleware";
import { loginRequired } from "../middleware/users.middleware";
import { body, param } from 'express-validator';

import * as users from "../controllers/users.controller";

module.exports = (app: Express) => {
    app.route(rootUrl + "/users/register")
        .post(body("firstName").isLength({min: 1}),
            body("lastName").isLength({min: 1}),
            body("password").isLength({min: 1}),
            body("email").isEmail(),
            handleValidation(),
            users.register);

    app.route(rootUrl + "/users/login")
        .post(body("password").isLength({min: 1}),
            body("email").isEmail(),
            handleValidation(),
            users.login);

    app.route(rootUrl + "/users/logout")
        .post(loginRequired(),
            users.logout);

    app.route(rootUrl + "/users/:id")
        .get(param("id").isInt({min : 1}),
            handleValidation(404),
            loginRequired(false),
            users.getUser)
        .patch(loginRequired(),
            param("id").isInt({min : 1}),
            handleValidation(),
            users.patchUser);
};