export const passwordResetEnabled =
  process.env.PASSWORD_RESET_ENABLED?.toLowerCase() === "true";

export const passwordResetUnavailableMessage =
  "Password reset isn't available yet. Please contact admin@ripplemedia.space";