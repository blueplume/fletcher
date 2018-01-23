const { injectHeaders } = require('./trace');

module.exports = (res, span) => fetch({ headers: injectHeaders({}) });
