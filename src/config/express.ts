import express from "express";
import bodyParser from "body-parser"
import allowCrossOriginRequestsMiddleware from '../app/middleware/cors.middleware';
import Logger from "./logger";


export default () => {
    const app = express();
    // MIDDLEWARE
    app.use(allowCrossOriginRequestsMiddleware);
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    app.use(bodyParser.raw({ type: 'text/plain' }));  // for the /executeSql endpoint
    app.use(bodyParser.raw({type: "image/jpeg", limit: "500mb"}));
    app.use(bodyParser.raw({type: "image/png", limit: "500mb"}));
    app.use(bodyParser.raw({type: "image/gif", limit: "500mb"}));

    // DEBUG (you can remove these)
    app.use((req, res, next) => {
        Logger.http(`##### ${req.method} ${req.path} #####`);
        next();
    });

    // ROUTES
    require('../app/routes/backdoor.routes')(app);
    require('../app/routes/users.routes')(app);
    require('../app/routes/users.images.routes')(app);
    require('../app/routes/auctions.routes')(app);
    require('../app/routes/auctions.bids.routes')(app);
    require('../app/routes/auctions.images.routes')(app);


    return app;

};
