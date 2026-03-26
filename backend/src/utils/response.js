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
 * @param {Error} err
 */
export function error(res, err) {
  const status  = err.statusCode || 500;
  const message = err.message    || 'Internal server error';
  const code    = err.code       || 'INTERNAL_ERROR';

  return res.status(status).json({ success: false, error: { code, message } });
}