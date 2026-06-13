const isProd = process.env.NODE_ENV === 'production';

/**
 * Send a successful JSON response.
 */
export function success(res, data = null, status = 200) {
  return res.status(status).json({ success: true, data });
}

/**
 * Send an error JSON response.
 * In production: never leak stack traces or internal error details.
 */
export function error(res, err, status = 500) {
  let statusCode = status;
  let message = 'Internal server error';
  let code = 'INTERNAL_ERROR';

  if (typeof err === 'string') {
    message = err;
    statusCode = status;
  } else if (err) {
    statusCode = err.statusCode || status;
    code = err.code || 'INTERNAL_ERROR';
    // In production, only expose messages from known safe error classes
    if (!isProd || err.statusCode < 500) {
      message = err.message || 'Internal server error';
    }
  }

  return res.status(statusCode).json({ success: false, error: { code, message } });
}
