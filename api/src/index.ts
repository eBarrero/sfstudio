import { createApp } from "./app";
import { config } from "./config/environment";
import container from "./container";
import { createApiRouter } from "./sessionManager/infrastructure/input_adapter/router";

const app = createApp({
    apiRouter: createApiRouter(container),
    readinessProbe: container.readinessProbe,
    environment: config.environment,
});

app.listen(config.port, () => {
    console.log(`Server is running on port ${config.port} (${config.environment})`);
});
