export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code       = code;
    this.name       = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(msg = 'Unauthorized') {
    super(msg, 401, 'UNAUTHORIZED');
  }
}

export class BadRequestError extends AppError {
  constructor(msg = 'Bad request') {
    super(msg, 400, 'BAD_REQUEST');
  }
}

export class ShopifyApiError extends AppError {
  constructor(msg = 'Shopify API error') {
    super(msg, 502, 'SHOPIFY_API_ERROR');
  }
}

export class AiError extends AppError {
  constructor(msg = 'AI service error') {
    super(msg, 502, 'AI_ERROR');
  }
}