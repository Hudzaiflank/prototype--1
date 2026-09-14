import { comparePassword, hashPassword } from "../utils/password.js";
import { AppError } from "../utils/errors.js";
import {
  findUserByEmail,
  findUserById,
  findValidRefreshTokens,
  revokeAllRefreshTokens,
  revokeRefreshToken,
  storeRefreshToken,
  updateLastLogin,
  updatePassword,
} from "../repositories/user.repository.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/token.js";

const normalizeEmail = (email) => email.trim().toLowerCase();

const publicUser = (user) => ({
  id: user.id,
  role: user.role,
  fullName: user.full_name,
  email: user.email,
  school: user.school_id
    ? { id: user.school_id, name: user.school_name }
    : null,
});

const tokenPayload = (user) => ({
  userId: user.id,
  role: user.role,
  schoolId: user.school_id,
});

async function issueTokens(user) {
  const accessToken = signAccessToken(tokenPayload(user));
  const refreshToken = signRefreshToken(tokenPayload(user));
  const refreshPayload = verifyRefreshToken(refreshToken);
  await storeRefreshToken(
    user.id,
    await hashPassword(refreshToken),
    new Date(refreshPayload.exp * 1000),
  );
  return { accessToken, refreshToken };
}

export async function login(email, password) {
  const user = await findUserByEmail(normalizeEmail(email));
  if (
    !user ||
    user.status !== "ACTIVE" ||
    !(await comparePassword(password, user.password_hash))
  )
    throw new AppError("Invalid email or password", "INVALID_CREDENTIALS", 401);
  if (user.school_id && user.school_status === "INACTIVE")
    throw new AppError("School is inactive", "SCHOOL_INACTIVE", 403);
  await updateLastLogin(user.id);
  const tokens = await issueTokens(user);
  return { ...tokens, user: publicUser(user) };
}

export async function refresh(refreshToken) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError("Invalid refresh token", "INVALID_REFRESH_TOKEN", 401);
  }
  const tokens = await findValidRefreshTokens(payload.userId);
  let storedToken;
  for (const candidate of tokens) {
    if (await comparePassword(refreshToken, candidate.token_hash)) {
      storedToken = candidate;
      break;
    }
  }
  if (!storedToken)
    throw new AppError("Invalid refresh token", "INVALID_REFRESH_TOKEN", 401);
  const user = await findUserById(payload.userId);
  if (!user || user.status !== "ACTIVE")
    throw new AppError("User is inactive", "USER_INACTIVE", 403);
  await revokeRefreshToken(storedToken.id);
  return { ...(await issueTokens(user)), user: publicUser(user) };
}

export async function logout(userId) {
  await revokeAllRefreshTokens(userId);
}

export async function getCurrentUser(userId) {
  const user = await findUserById(userId);
  if (!user || user.status !== "ACTIVE")
    throw new AppError("User not found", "USER_NOT_FOUND", 404);
  return publicUser(user);
}

export async function changePassword(userId, currentPassword, newPassword) {
  const user = await findUserById(userId);
  if (!user || !(await comparePassword(currentPassword, user.password_hash)))
    throw new AppError(
      "Current password is incorrect",
      "INVALID_PASSWORD",
      400,
    );
  await updatePassword(userId, await hashPassword(newPassword));
  await revokeAllRefreshTokens(userId);
}
