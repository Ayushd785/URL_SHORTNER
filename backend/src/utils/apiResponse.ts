import { Response } from "express";

// Define response interfaces
export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

// Success response helper
export const successResponse = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
): void => {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    message,
  };

  res.status(statusCode).json(response);
};

// Error response helper
export const errorResponse = (
  res: Response,
  code: string,
  message: string,
  details?: any,
  statusCode: number = 400
): void => {
  const response: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };

  res.status(statusCode).json(response);
};

// Validation error helper
export const validationErrorResponse = (res: Response, errors: any): void => {
  errorResponse(
    res,
    "VALIDATION_ERROR",
    "Please check your input data",
    errors,
    422
  );
};
