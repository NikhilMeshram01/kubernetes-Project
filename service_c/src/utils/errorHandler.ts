import type { NextFunction, Request, Response } from "express";
import { NODE_ENV } from "../configs/configs.js";

export class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);

    // initialize properties
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true; // distinguish operational errors from programming errors

    // ensure proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // default for unexpected errors
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  // log the error in development
  if (NODE_ENV === "development") {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }

  if (!err.isOperational)
    return res.status(500).json({
      status: "error",
      message: "Something went wrong",
    });

  return res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
};
