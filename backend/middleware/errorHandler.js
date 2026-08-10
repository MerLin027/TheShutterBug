/**
 * Central error handling.
 *
 * Express 5 auto-forwards a rejected promise from an async route handler, so
 * routes do NOT need their own try/catch just to turn an error into a
 * response. Before this file existed, all eleven handlers carried a
 * copy-pasted `catch` that each re-derived the same three mappings — and got
 * them slightly different every time (only some logged, only some handled
 * CastError, one leaked `error.message` straight to the client).
 *
 * Routes now throw (or `next(err)`) and this decides the status code. A route
 * that wants a *deliberate* 4xx still returns it inline — that is business
 * logic, not error handling. To raise one from deeper code, set `err.status`.
 */

/** JSON 404 for unmatched paths — Express's default is an HTML page. */
export const notFound = (req, res) => {
  res.status(404).json({ message: `Not found — ${req.method} ${req.originalUrl}` });
};

// The 4-argument signature is what marks this as an error handler to Express —
// it must keep all four even though `next` is only reached in one branch.
export const errorHandler = (err, req, res, next) => {
  // Something already started writing (e.g. a stream failed mid-response).
  // Express's default handler is the only thing that can close this cleanly.
  if (res.headersSent) {
    return next(err);
  }

  // Bad ObjectId in a path param or a query filter.
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid id' });
  }

  // Mongoose schema validation — surface the field messages, which are
  // written for humans ('Name is required', 'Please enter a valid email
  // address') and safe to return.
  if (err.name === 'ValidationError' && err.errors) {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: messages.join(', ') });
  }

  // multer. Checked by name rather than `instanceof MulterError` so this
  // module doesn't have to import multer.
  if (err.name === 'MulterError') {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Image is too large — maximum size is 25 MB'
        : `Upload failed — ${err.code}`;
    return res.status(400).json({ message });
  }

  // A status set deliberately upstream (e.g. the Cloudinary fileFilter).
  const status = err.status || err.statusCode;
  if (status && status < 500) {
    return res.status(status).json({ message: err.message || 'Bad Request' });
  }

  // Anything else is a genuine server fault. The detail goes to the Render
  // log; the client gets a fixed string. `err.message` on a driver or
  // mongoose failure can carry schema internals and connection detail, and
  // this used to be returned verbatim.
  console.error(err.stack || err);
  res.status(500).json({ message: 'Server Error' });
};
