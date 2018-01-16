const opentracing = require("opentracing");
const initTracer = require('jaeger-client').initTracer;
const SpanContext = require('jaeger-client').SpanContext;

function unpackOptions(arguments) {
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
    const parentContext = typeof req.get('uber-trace-id') === 'string' 
      && SpanContext.fromString(req.get('uber-trace-id'));
    const span = tracer.startSpan(req.originalUrl, { childOf: parentContext });

    res.traceStack = {
      tracer,
      span,
      parentContext: span.context()
    };

    res.traceStack.span.setTag(opentracing.Tags.SAMPLING_PRIORITY, 1);
    const headers = {};
    res.traceStack.tracer.inject(res.traceStack.span,
      opentracing.FORMAT_HTTP_HEADERS,
      headers);

    res.on('finish', () => {
      res.traceStack.span.finish();
    })

    next();
  };
}

module.exports = {
  createTracerMiddleware
}