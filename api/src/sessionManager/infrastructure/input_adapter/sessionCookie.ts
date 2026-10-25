import { CookieOptions, Request, Response } from "express";
import { RuntimeEnvironment } from "../../../config/environment";
import {
    isSessionId,
    SessionId,
    WORKSPACE_SESSION_TTL_MS,
} from "../../domain/entities/workspaceSession";

export const SESSION_COOKIE_NAME = "sfstudio_workspace";

function getBaseCookieOptions(environment: RuntimeEnvironment): CookieOptions {
    return {
        httpOnly: true,
        secure: environment === "PROD",
        sameSite: "lax",
        path: "/",
    };
}

export function getSessionCookieOptions(environment: RuntimeEnvironment): CookieOptions {
    return {
        ...getBaseCookieOptions(environment),
        maxAge: WORKSPACE_SESSION_TTL_MS,
    };
}

export function readSessionCookie(request: Request): SessionId | undefined {
    const value: unknown = request.cookies?.[SESSION_COOKIE_NAME];
    return isSessionId(value) ? value : undefined;
}

export function hasSessionCookie(request: Request): boolean {
    return request.cookies?.[SESSION_COOKIE_NAME] !== undefined;
}

export function setSessionCookie(
    response: Response,
    sessionId: SessionId,
    environment: RuntimeEnvironment,
): void {
    response.cookie(SESSION_COOKIE_NAME, sessionId, getSessionCookieOptions(environment));
}

export function clearSessionCookie(response: Response, environment: RuntimeEnvironment): void {
    response.clearCookie(SESSION_COOKIE_NAME, getBaseCookieOptions(environment));
}
