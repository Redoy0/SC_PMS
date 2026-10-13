// Express 4 does not catch rejected promises from async handlers; forward them
// to the error middleware instead of leaving the request hanging.
export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
