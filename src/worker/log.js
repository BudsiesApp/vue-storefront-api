var winston = require('winston');

winston.emitErrs = true;

if (!global.logger) {
  const debugLevel = process.env.LOG_LEVEL || 'warn';
  const colorize = process.env.LOG_COLORIZE === 'true' || process.env.LOG_COLORIZE === '1';

  global.logger = new winston.Logger({
    transports: [
      new winston.transports.Console({
        level: debugLevel,
        handleExceptions: false,
        json: false,
        prettyPrint: true,
        colorize: colorize,
        timestamp: true
      })
    ],
    exitOnError: false
  });
}

module.exports = global.logger;
