import * as usersModel from "../models/users.model";
import Logger from "../../config/logger";
import {Request, Response} from "express";
import { User } from "../app_types";
import * as passwords from "../middleware/passwords.middleware";
import * as Validator from "express-validator";

/**
 * Provides the functionality for registering users at the users/register endpoint.
 * <br>
 * ToDo maybe make password hashing middleware this middleware.
 * <br>
 * @param req - The user POST request, should have validation for:
 *             <br> - firstName: at least length 1
 *             <br> - lastName: at least length 1
 *             <br> - email, is of valid email form, and exists
 *             <br> - password is at least length 1
 * @param res - The response sent to the requester:
 *             <br> - 201: if the request has all the required input fields and the email isn't already used,
 *                         includes userId in the body
 *             <br> - 400: if any input fields are invalid, or the email is already in use.
 *             <br> - 500: if any errors occur during the registration
 */
const register = async (req: Request, res: Response) : Promise<void> => {
    Logger.http(`POST register user: ${req.body.firstName} ${req.body.lastName} (${req.body.email})`)
    // Check request has required fields if not return 400: Bad Request
    try {
        const user: User = req.body;

        user.password = await passwords.hash(user.password);
        // Check email is unique
        if (!((await usersModel.getUserByEmail(user.email)) === null)) {
            res.statusMessage = "Bad request: email already in use"
            res.status(403).send(); // CHECK: Server has it as 403, but I think it should be 400
            return
        }

        const result = await usersModel.addUser(user);
        res.status(201).json({userId: result.insertId});
    } catch (err) {
        Logger.error(err);
        res.status(500).send();
    }
};

/**
 * Provides the functionality for logging in users at the users/login endpoint.
 * <br>
 * Checks if a provided email and password match an existing user, if so returns the users id and ,
 * a token and adds the token to the user in the DB
 * <br>
 * @param req - The user POST request, should have validation for:
 *             <br> - email, is of valid email form,
 *             <br> - password is at least length 1
 * @param res - The response sent to the requester:
 *             <br> - 200: if the email exists in the users, and the password matches,
 *                         the response includes the userID and the jwtToken produced for the user
 *             <br> - 400: if any input fields are invalid, the email doesn't exist in DB or the password doesn't match
 *             <br> - 500: if any errors occur during the login
 */
const login = async (req: Request, res: Response) : Promise<any> => {
    Logger.http(`POST attempting to log in user: ${req.body.email}`)
    try {
        const {email, password} = req.body;

        const user: User = await usersModel.getUserByEmail(email);
        if ((user === null) || (! await passwords.authenticateUser(user, password))) {
            res.statusMessage = 'Bad Request: invalid email/password supplied'
            res.status(400).send();
            return
        } else {
            const token: string = await usersModel.addTokenToUser(email);
            res.status(200).json({userId: user.userId, token: `${token}`});
            return
        }
    } catch (err) {
        Logger.error(err);
        res.status(500).send();
    }
};

/**
 * Provides the functionality for logging out users at the users/logout endpoint.
 * <br>
 * The controller only has to deal with successfully authenticated users, the middleware throws 401 for us
 * <br>
 * @param req - The user POST request, should have validation for:
 *             <br> - checking the X-Authorization token and extracting the user to res.locals.user
 * @param res - The response sent to the requester:
 *             <br> - 200: if the X-Authorization matches a token in the DB
 *             <br> - 401: if the X-Authorization doesn't match any token in the DB (handled by middleware)
 *             <br> - 500: if any errors occur during the logout
 */
const logout = async (req: Request, res: Response) : Promise<void> => {
    Logger.http(`GET retrieving user with user id: ${res.locals.user.userId}`);
    try {
        await usersModel.logout(res.locals.user);
        res.status(200).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.status(500).send();
    }

};

/**
 * Provides the functionality for getting user information at the users/{:id} endpoint.
 * <br>
 * Any user can be retrieved if they exist, however only firstName and lastName are retrieved if the request is not for
 * the authenticated user. Email is included if the user requests themself.
 * ToDo check if unauthorized users can access information
 * <br>
 * @param req - The user POST request, should have validation for:
 *             <br> - checking the X-Authorization token and extracting the user to res.locals.user
 *             <br> - the req.params.id should be checked to ensure numeric.
 * @param res - The response sent to the requester:
 *             <br> - 200: if the userID matches any users in the database,
 *                         information includes firstName lastName (email if requesting themselves)
 *             <br> - 404: if the X-Authorization is not valid or the user requested doesn't exist
 *             <br> - 500: if any errors occur during the retrieval of the user
 */
const getUser = async (req: Request, res: Response) : Promise<void> => {
    Logger.http(`GET retrieving user with user id: ${req.params.id}`);
    try {
        const userID: number = parseInt(req.params.id, 10);
        const requestedUser: User = await usersModel.getUserByID(userID);
        if (requestedUser == null) {
            res.status(404).send();
            return;
        }
        if (res.locals.user !== null && res.locals.user.userId === userID) {
            res.status(200).json({"firstName": requestedUser.firstName,
                                        "lastName": requestedUser.lastName,
                                        email: requestedUser.email});
        } else {
            res.status(200).json({"firstName": requestedUser.firstName, "lastName": requestedUser.lastName});
        }
    } catch (err) {
        Logger.error(err);
        res.status(500).send();
    }
};

/**
 * Provides the functionality for updating user information at the users/{:id} endpoint.
 * <br>
 * Users can only change their own information. This function uses the helper function update Fields to check the fields
 * input and set the input ones to be update, if they are valid. If fields are not valid corresponding errorcodes are
 * returned for the response to send.
 * <br>
 * @param req - The user POST request, should have validation for:
 *             <br> - checking the X-Authorization token and extracting the user to res.locals.user
 *             <br> - the req.params.id should be checked to ensure numeric.
 * @param res - The response sent to the requester:
 *             <br> - 200: if the update is valid and is successful
 *             <br> - 400: if the email is not of the valid form, or the email is in use.
 *             <br> - 401: if the password is attempted to be changed, without inputting the old password correctly
 *             <br> - 403: if the X-Authorization is not valid, or the user tries to edit someone else's information
 *             <br> - 500: if any errors occur during the updating of the user
 */
const patchUser = async (req: Request, res: Response) : Promise<any> => {
    Logger.http(`PATCH editing user with user id: ${req.params.id}`);
    try {
        const userID: number = parseInt(req.params.id, 10);
        const userChanges: User = req.body;
        if (!(res.locals.user.userId === userID)) {
            res.status(403).send();
            return;
        }

        if (userChanges.firstName != null) {
            res.locals.user.firstName = userChanges.firstName;
        }
        if (userChanges.lastName != null) {
            res.locals.user.lastName = userChanges.lastName;
        }
        if (userChanges.password != null && await passwords.authenticateUser(res.locals.user, userChanges.currentPassword)) {
            res.locals.user.password = userChanges.password;
        } else {
            res.statusMessage = `Bad Request: incorrect password`
            res.status(400).send();
            return;
        }
        if (userChanges.email != null || userChanges.email === res.locals.user.email) {
            if (!await usersModel.getUserByEmail(userChanges.email)) {
                // Check new email is valid
                Validator.body("email").isEmail();
                if (Validator.validationResult(req).isEmpty()) {
                    res.locals.user.email = userChanges.firstName;
                } else {
                    Logger.info("Bad Request: invalid email format");
                    res.statusMessage = "Bad Request: email must be a valid email address";
                    res.status(400).send();
                    return;
                }
            } else {
                Logger.info("Email already in use");
                res.statusMessage = "Bad Request: email already in use";
                res.status(400).send();
                return;
            }
        }
        await usersModel.updateUser(res.locals.user);
        // Update the user in the model
        res.status(200).send();
        return;


    } catch (err) {
        Logger.error(err);
        res.status(500).send();
    }
};


export { register, login, logout, getUser, patchUser }