export const ERROR_CODES = {
  // Authentication errors
  USER_NOT_FOUND: "USER_NOT_FOUND",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  EMAIL_ALREADY_EXISTS: "EMAIL_ALREADY_EXISTS",
  INVALID_TOKEN: "INVALID_TOKEN",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  UNAUTHORIZED: "UNAUTHORIZED",

  // Validation errors
  VALIDATION_ERROR: "VALIDATION_ERROR",
  MISSING_REQUIRED_FIELDS: "MISSING_REQUIRED_FIELDS",
  INVALID_EMAIL_FORMAT: "INVALID_EMAIL_FORMAT",
  PASSWORD_TOO_WEAK: "PASSWORD_TOO_WEAK",

  // URL errors
  URL_NOT_FOUND: "URL_NOT_FOUND",
  INVALID_URL: "INVALID_URL",
  ALIAS_ALREADY_EXISTS: "ALIAS_ALREADY_EXISTS",

  // Server errors
  SERVER_ERROR: "SERVER_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
} as const;

export const ERROR_MESSAGES = {
  [ERROR_CODES.USER_NOT_FOUND]: "User not found",
  [ERROR_CODES.INVALID_CREDENTIALS]: "Invalid email or password",
  [ERROR_CODES.EMAIL_ALREADY_EXISTS]:
    "An account with this email already exists",
  [ERROR_CODES.INVALID_TOKEN]: "Invalid or malformed token",
  [ERROR_CODES.TOKEN_EXPIRED]: "Token has expired",
  [ERROR_CODES.UNAUTHORIZED]: "You are not authorized to perform this action",

  [ERROR_CODES.VALIDATION_ERROR]: "Please check your input data",
  [ERROR_CODES.MISSING_REQUIRED_FIELDS]: "Required fields are missing",
  [ERROR_CODES.INVALID_EMAIL_FORMAT]: "Please enter a valid email address",
  [ERROR_CODES.PASSWORD_TOO_WEAK]:
    "Password must be at least 8 characters long",

  [ERROR_CODES.URL_NOT_FOUND]: "Short URL not found",
  [ERROR_CODES.INVALID_URL]: "Please enter a valid URL",
  [ERROR_CODES.ALIAS_ALREADY_EXISTS]: "This custom alias is already taken",

  [ERROR_CODES.SERVER_ERROR]: "Internal server error",
  [ERROR_CODES.DATABASE_ERROR]: "Database operation failed",
} as const;
