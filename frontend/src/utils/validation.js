export const isRequired = (value) => Boolean(String(value ?? "").trim());
export const isRoomCode = (value) => /^[A-Z0-9]{6}$/.test(value);
