const opentracing = require('opentracing');

module.exports = (res) => {
  res.traceStack.tracer.inject(
    span,
    opentracing.FORMAT_HTTP_HEADERS,
    headers,
  );
};
