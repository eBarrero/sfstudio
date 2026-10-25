import express from "express";
import type { AppContainer } from "../../../container";

export function createApiRouter(container: AppContainer): express.Router {
    const router = express.Router();

    router.get(
        "/api/init",
        container.signInCtrl.login.bind(container.signInCtrl),
    );

    router.get(
        "/api/auth/:tech",
        container.requestConnectionCtrl.getNewUrlConnection.bind(container.requestConnectionCtrl),
    );

    router.get(
        "/api/connections/:connectionId",
        container.signInCtrl.setUser.bind(container.signInCtrl),
        container.requestConnectionCtrl.getUrlConnection.bind(container.requestConnectionCtrl),
    );

    router.get(
        "/api/callback",
        container.requestedConnectionCtrl.salesforce.bind(container.requestedConnectionCtrl),
    );

    router.get(
        "/api/logout/:dbName",
        container.signInCtrl.setUser.bind(container.signInCtrl),
        container.signOutCtrl.do.bind(container.signOutCtrl),
    );

    router.get(
        "/api/describeGlobal/:dbName",
        container.signInCtrl.setUser.bind(container.signInCtrl),
        container.httpMetadataCtrl.getDescribeGlobal.bind(container.httpMetadataCtrl),
    );

    router.get(
        "/api/describe/:dbName/:sobject",
        container.signInCtrl.setUser.bind(container.signInCtrl),
        container.httpMetadataCtrl.getObjectDescription.bind(container.httpMetadataCtrl),
    );

    router.get(
        "/api/soql/:dbName/:soql",
        container.signInCtrl.setUser.bind(container.signInCtrl),
        container.httpMetadataCtrl.getSOQL.bind(container.httpMetadataCtrl),
    );

    return router;
}
