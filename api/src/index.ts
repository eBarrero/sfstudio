import { createApp } from "./app";
import { config } from "./config/environment";
import container from "./container";
import { createApiRouter } from "./sessionManager/infrastructure/input_adapter/router";
import { logger } from "./infrastructure/frameworks/structuredLogger";

const app = createApp({
    apiRouter: createApiRouter(container),
    readinessProbe: container.readinessProbe,
    environment: config.environment,
});

app.listen(config.port, () => {
    logger.info("server.started", {
        port: config.port,
        environment: config.environment,
    });
});
