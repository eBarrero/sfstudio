import express from "express";

export interface ReadinessProbe {
    isReady(): Promise<boolean>;
}

export function createHealthRouter(readinessProbe: ReadinessProbe): express.Router {
    const router = express.Router();

    router.get("/health", (_request, response) => {
        response.status(200).json({ status: "ok" });
    });

    router.get("/ready", async (_request, response) => {
        try {
            const ready = await readinessProbe.isReady();

            if (ready) {
                response.status(200).json({ status: "ready" });
                return;
            }
        } catch {
            // Readiness is intentionally reported without exposing connection details.
        }

        response.status(503).json({ status: "not_ready" });
    });

    return router;
}
