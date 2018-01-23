const { injectHeaders } = require('./trace');
const requestLib = require('request-promise-native');

function request(res, span) {
  return requestLib.defaults({ headers: injectHeaders({}) });
}

module.exports = request;
