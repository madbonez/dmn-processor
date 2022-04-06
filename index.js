/*
*
*  ©2016-2017 EdgeVerve Systems Limited (a fully owned Infosys subsidiary),
*  Bangalore, India. All Rights Reserved.
*
*/

const decisionTable = require('./utils/helper/decision-table-xml.js');
const feel = require('./dist/feel');
const dateTime = require('./utils/built-in-functions/date-time-functions');
const { configureLogger } = require('./logger');
const feelSettings = require('./settings');

const dmnEvalJs = {
  decisionTable,
  feel,
  dateTime,
};

dmnEvalJs.init = function (settings) {
  const { logger, enableLexerLogging, enableExecutionLogging, logResult } = settings;
  configureLogger(logger);
  if (enableExecutionLogging !== undefined) {
    feelSettings.enableExecutionLogging = enableExecutionLogging;
  }
  if (enableLexerLogging !== undefined) {
    feelSettings.enableLexerLogging = enableLexerLogging;
  }
  if (logResult !== undefined) {
    feelSettings.logResult = logResult;
  }
};

dmnEvalJs.use = function (plugin) {
  plugin.call(this);
};

module.exports = dmnEvalJs;
