/**
 * Send a successful JSON response.
 * @param {Response} res
 * @param {*} data
 * @param {number} status  default 200
 */
export function success(res, data = null, status = 200) {
  return res.status(status).json({ success: true, data });
}

/**
 * Send an error JSON response.
 * Reads status and message from custom error classes when available.
 * @param {Response} res
 * @param {Error|string} err
 * @param {number} status
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
    message = err.message || 'Internal server error';
    code = err.code || 'INTERNAL_ERROR';
  }

  return res.status(statusCode).json({ success: false, error: { code, message } });
}