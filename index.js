const opentracing = require("opentracing");
const initTracer = require('jaeger-client').initTracer;
const SpanContext = require('jaeger-client').SpanContext;

function unpackOptions(...args) {
  return (typeof arguments[0] === 'object' ? arguments[0] : {
    config: {
      serviceName: arguments[0],
      reporter: {
        agentHost: arguments[1],
        agentPort: arguments[2],
        flushIntervalMs: 500        
      }
    },
    options: {
      tags: arguments[3]
    }
  })
}

function createTracerMiddleware() {
  return (req, res, next) => {
    const conf = unpackOptions(arguments);
    const tracer = initTracer(conf.config, conf.options);
    const parentContext = typeof req.get('uber-trace-id') === 'string' &&
      SpanContext.fromString(req.get('uber-trace-id'));

    let span
    if (!parentContext) {
      span = tracer.startSpan(req.originalUrl, { childOf: parentContext })
                   .setTag(opentracing.Tags.SAMPLING_PRIORITY, 1);
    }

    const spanContext = parentContext ? parentContext
      : span.context();

    res.traceStack = {
      tracer,
      parentContext: spanContext
    };

    const headers = {};
    res.traceStack.tracer.inject(res.traceStack.span,
      opentracing.FORMAT_HTTP_HEADERS,
      headers);

    res.on('finish', () => {
      span && span.finish();
    })

    next();
  };
}

module.exports = {
  createTracerMiddleware
}