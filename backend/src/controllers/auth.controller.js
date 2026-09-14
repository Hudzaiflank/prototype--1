import { env } from "../config/env.js";
import * as authService from "../services/auth.service.js";

const cookieOptions = {
  httpOnly: true,
  secure: env.nodeEnv === "production",
  sameSite: "lax",
  path: `${env.apiPrefix}/auth`,
};

const setRefreshCookie = (response, token) =>
  response.cookie(env.refreshCookieName, token, cookieOptions);

export async function login(request, response, next) {
  try {
    const result = await authService.login(
      request.validated.body.email,
      request.validated.body.password,
    );
    setRefreshCookie(response, result.refreshToken);
    response.json({
      success: true,
      data: {
        accessToken: result.accessToken,
        expiresIn: 7200,
        user: result.user,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function refresh(request, response, next) {
  try {
    const token = request.cookies[env.refreshCookieName];
    const result = await authService.refresh(token ?? "");
    setRefreshCookie(response, result.refreshToken);
    response.json({
      success: true,
      data: { accessToken: result.accessToken, expiresIn: 7200 },
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(request, response, next) {
  try {
    await authService.logout(request.user.userId);
    response.clearCookie(env.refreshCookieName, cookieOptions);
    response.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
}

export async function me(request, response, next) {
  try {
    response.json({
      success: true,
      data: await authService.getCurrentUser(request.user.userId),
    });
  } catch (error) {
    next(error);
  }
}

export async function changePassword(request, response, next) {
  try {
    await authService.changePassword(
      request.user.userId,
      request.validated.body.currentPassword,
      request.validated.body.newPassword,
    );
    response.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    next(error);
  }
}
