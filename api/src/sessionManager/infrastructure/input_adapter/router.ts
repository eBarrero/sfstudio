import express from "express";
import type { AppContainer } from "../../../container";

export function createApiRouter(container: AppContainer): express.Router {
    const router = express.Router();

    router.get(
        "/api/init",
        container.signInCtrl.login.bind(container.signInCtrl),
    );

    router.get(
        "/api/v1/workspace",
        container.signInCtrl.workspace.bind(container.signInCtrl),
    );

    router.get(
        "/api/auth/:tech",
        container.requestConnectionCtrl.getNewUrlConnection.bind(container.requestConnectionCtrl),
    );

    router.get(
        "/api/v1/connections/:orgKey/authorize",
        container.signInCtrl.setUser.bind(container.signInCtrl),
        container.requestConnectionCtrl.getUrlConnection.bind(container.requestConnectionCtrl),
    );

    router.get(
        "/api/callback",
        container.requestedConnectionCtrl.salesforce.bind(container.requestedConnectionCtrl),
    );

    router.delete(
        "/api/v1/workspace/orgs/:orgKey",
        container.signInCtrl.setUser.bind(container.signInCtrl),
        container.disconnectOrgCtrl.do.bind(container.disconnectOrgCtrl),
    );

    router.delete(
        "/api/v1/workspace",
        container.signInCtrl.setUser.bind(container.signInCtrl),
        container.signOutCtrl.do.bind(container.signOutCtrl),
    );

    router.post(
        "/api/v1/workspace/active-org",
        container.signInCtrl.setUser.bind(container.signInCtrl),
        container.selectActiveOrgCtrl.do.bind(container.selectActiveOrgCtrl),
    );

    router.get(
        "/api/describeGlobal/:orgKey",
        container.signInCtrl.setUser.bind(container.signInCtrl),
        container.httpMetadataCtrl.getDescribeGlobal.bind(container.httpMetadataCtrl),
    );

    router.get(
        "/api/describe/:orgKey/:sobject",
        container.signInCtrl.setUser.bind(container.signInCtrl),
        container.httpMetadataCtrl.getObjectDescription.bind(container.httpMetadataCtrl),
    );

    router.post(
        "/api/v1/query",
        container.signInCtrl.setUser.bind(container.signInCtrl),
        container.httpMetadataCtrl.postQuery.bind(container.httpMetadataCtrl),
    );

    router.post(
        "/api/v1/query/next",
        container.signInCtrl.setUser.bind(container.signInCtrl),
        container.httpMetadataCtrl.postNextQueryPage.bind(container.httpMetadataCtrl),
    );

    return router;
}
