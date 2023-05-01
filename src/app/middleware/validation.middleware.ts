import {NextFunction, Request, Response} from "express";
import * as Validator from "express-validator";
import Logger from "../../config/logger";


const handleValidation = (errorCode: number = 400) => (req: Request, res: Response, next: NextFunction) => {
    const errors = Validator.validationResult(req);
    if (!errors.isEmpty()) {
        res.status(errorCode)
        if (errors.array()[0].value === undefined) {
            res.statusMessage = `Bad Request: data should have required property '${errors.array()[0].param}'`
            return res.send();
        }
        if (errors.array()[0].param === 'email') {
            res.statusMessage = `Bad Request: data.email should match format "email"`;
        }
        const integerTypes: string[] = ['startIndex', 'id', 'categoryId', 'sellerId', 'bidderId', 'count']
        if (integerTypes.includes(errors.array()[0].param)) {
            if (isNaN(parseInt(errors.array()[0].value, 10)))
                res.statusMessage = `Bad Request: data.${errors.array()[0].param} should be integer`;
            else
                res.statusMessage = `Bad Request: data.${errors.array()[0].param} should be >= 0`;

        }
        if (errors.array()[0].param === "sortBy")
            res.statusMessage = "Bad Request: data.sortBy should be equal to one of the allowed values"
        res.send(errors.array()[0]);
        return;
    }
    next();
}

const checkEndDateInFutureRequired = async (req: Request, res: Response, next: NextFunction) => {

    if (req.body.hasOwnProperty("endDate")) {
        if (! await checkValidDate(req, res)) {
            return res.status(400).send();
        }
        next();
        return;
    }
    res.status(400).send("Missing field endDate");
}

const checkEndDateInFutureOptional = async (req: Request, res: Response, next: NextFunction) => {

    if (req.body.hasOwnProperty("endDate")) {
        if (! await checkValidDate(req, res)) {
            return res.status(400).send();
        }
    }
    next();
}

const checkValidDate = async (req: Request, res: Response): Promise<boolean> => {
    const inputDate  = new Date(req.body.endDate);
    if (inputDate.toString() === "Invalid Date") { // Check this, example server throws 500.
        Logger.info("Bad Request: invalid date format");
        res.statusMessage = "Bad Request: invalid date format";
        return false;
    }

    const currentDate: Date = new Date();
    if (inputDate <= currentDate) {
        Logger.info("Bad Request: auction end date must be in the future");
        res.statusMessage = "Bad Request: auction end date must be in the future";
        return false;
    }
    req.body.endDate = inputDate;
    return true;
}

export { handleValidation, checkEndDateInFutureRequired, checkEndDateInFutureOptional }