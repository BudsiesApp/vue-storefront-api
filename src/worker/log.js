var winston = require('winston');

winston.emitErrs = true;

if (!global.logger) {
  const debugLevel = process.env.LOG_LEVEL || 'warn';

  global.logger = new winston.Logger({
    transports: [
      new winston.transports.Console({
        level: debugLevel,
        handleExceptions: false,
        json: false,
        prettyPrint: true,
        colorize: true,
        timestamp: true
      })
    ],
    exitOnError: false
  });
}

module.exports = global.logger;
