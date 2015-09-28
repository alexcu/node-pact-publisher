/*
 * Node Pact Publisher
 * https://github.com/alexcu-/node-pact-publisher
 *
 * Copyright (c) 2015 Alex Cummaudo.
 * Licensed under the MIT license.
 */
var request = require('request');
var fs      = require('fs');
var path    = require('path');
var log     = require('color-log');
var Q       = require('q');
var _       = require('underscore');

/**
 * A pact publisher
 * @param  {Object|String}  configOrVersion Config object or version number.
 *                                          If config object is provided, it's
 *                                          just an object containing:
 *                                          - {String} appVersion
 *                                          - {String} brokerBaseUrl
 *                                          - {Array|String} pact
 *                                          - {Boolean} logging (if set to
 *                                            false, no logs will be output)
 * @param  {String}         brokerBaseUrl   Base url of the remote pact broker.
 * @param  {Array|String}   pacts           Where pact contracts are located.
 *                                          Optional parameter. If array is
 *                                          provided, then it's expected that
 *                                          this will contain absolute paths
 *                                          of every pact JSON file. If string
 *                                          then it's expected that this is a
 *                                          directory containing pact JSON
 *                                          contracts and will publish every
 *                                          JSON file in that directory.
 */
function PactPublisher (configOrVersion, brokerBaseUrl, pacts) {
  var _version, _brokerBaseUrl, _pacts;
  if (!_.contains(['object', 'string'], typeof configOrVersion)) {
    throw new TypeError('Invalid first parameter provided constructing Pact Publisher. Expected a config object or version string for first parameter.');
  }
  _version        = configOrVersion.appVersion || configOrVersion;
  _brokerBaseUrl  = configOrVersion.brokerBaseUrl || brokerBaseUrl;
  _pacts          = configOrVersion.pacts || pacts;
  _logging        = _.isBoolean(configOrVersion.logging) ? configOrVersion.logging : true;
  if (!_.isString(_version)) {
    throw new Error("Expected a string for version number parameter.");
  }
  if (!_.isString(_brokerBaseUrl)) {
    throw new Error("Expected a string for broker base URL parameter.");
  }
  if (_pacts !== undefined && !(_.isString(_pacts) || _.isArray(_pacts))) {
    throw new Error("Expected a string or array for pacts parameter.");
  }
  this._appVersion          = _version;
  this._pactBrokerBaseUrl   = _brokerBaseUrl;
  this._pactUrl             = "{pactBaseUrl}/pacts/provider/{provider}/consumer/{consumer}/version/{version}".replace("{pactBaseUrl}", this._pactBrokerBaseUrl).replace('{version}', this._appVersion);
  this._logging             = _logging;
  if (_.isString(_pacts)) {
    if (!fs.existsSync(_pacts)) {
      throw new Error("Pact directory " + _pacts + " does not exist");
    }
    this._enqueuedPactFiles = fs.readdirSync(_pacts).filter(function (file) {
      return path.extname(file) === '.json';
    }).map(function (file) {
      return _pacts + '/' + file;
    });
  } else if (_.isArray(_pacts)) {
    this._enqueuedPactFiles = _pacts;
  } else {
    this._enqueuedPactFiles = [];
  }
};

/**
 * Logs a message if logging was enabled
 * @param  {String} msg  Message to log
 * @param  {String} type Optional type of message. Defaults to info.
 */
PactPublisher.prototype._log = function (msg, type) {
  if (this._logging) {
    log[type || 'info'](msg);
  }
};

/**
 * Gets all pacticipants registered in the pact broker
 * @return {Promise}  Promise to the pacts
 */
PactPublisher.prototype.getPacticipantNames = function () {
  var self = this;
  return Q.Promise(function (resolve, reject) {
    request({
      uri: self._pactBrokerBaseUrl + "/pacticipants",
      method: 'GET'
    }, function (err, res, body) {
      if (err || res.statusCode !== 200 || body.pacticipants === undefined) {
        reject(err || body);
      } else {
        resolve(_.pluck(body.pacticipants, 'name'));
      }
    });
  });
};

/**
 * Checks if a pacticipant with the given name has been registered
 * @param  {String} name Pact name to check
 * @return {Promise}     Promise to if the pact is registered
 */
PactPublisher.prototype.isPacticipantRegistered = function (name) {
  var self = this;
  return Q.Promise(function (resolve, reject) {
    self.getPacticipantNames().then(function (names) {
      resolve(_.contains(pactsRegistered, name))
    }, function (err) {
      reject(err);
    });
  });
};

/**
 * Registers a pact with the broker
 * @param  {String} name Pact name to check
 * @return {Promise}     Promise to if the pact was registered
 */
PactPublisher.prototype.registerPact = function (name) {
  var self = this;
  return Q.Promise(function (resolve, reject) {
    request({
      uri: self._pactBrokerBaseUrl + "/pacticipants",
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: name
      })
    }, function (err, res, body) {
      body = JSON.parse(body);
      if (err || res.statusCode !== 201 || body.name === undefined) {
        reject(err || body);
      } else {
        resolve(body);
      }
    });
  });
};

/**
 * Loads a pact from file
 * @param  {String}   pactFileName JSON contract
 * @return {Promise}               The pact loaded, or exception message
 */
PactPublisher.prototype._loadPactFile = function (pactFileName) {
  return Q.Promise(function (resolve, reject) {
    try {
      var pact = require(pactFileName);
      pact.pactFileName = pactFileName;
      resolve(pact);
      self._log('Loaded pact contract \'' + pactFileName + '\'');
    } catch (e) {
      reject(e.message);
    }
  });
};

/**
 * Publishes a pact
 * @param  {Object}   pact  The pact to publish
 * @return {Promise}        Promise to whether or not the pact was published
 *                          If rejected, then the reason is given
 */
PactPublisher.prototype._publish = function (pact) {
  var d = Q.defer();
  var self = this;

  this._log('Publishing \'' + pact.pactFileName + '\'...');

  var uri = this._pactUrl.replace("{provider}", pact.provider.name)
                         .replace("{consumer}", pact.consumer.name);
  request({
    uri: uri,
    method: 'PUT',
    json: true,
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    },
    body: pact
  }, function (err, res, body) {
    if (err || !_.contains([200, 201], res.statusCode)) {
      var msg = 'Error uploading pact file ' + pact.pactFileName + ' to broker';
      if (!_.contains([200, 201], res.statusCode)) {
        msg += '\n\tStatus Code: ' + res.statusCode + ' - ' + this.httpModule.STATUS_CODES[res.statusCode];
      }
      if (err) {
        msg += '\n\tError: ' + JSON.stringify(err);
      }
      if (body) {
        msg += '\n\tContent: ' + JSON.stringify(body);
      }
      self._log('Failed to publish \'' + pact.pactFileName + '\': ' + err, 'error');
      d.reject(msg);
    } else {
      self._log('\'' + pact.pactFileName + '\' published to broker!', 'mark');
      d.resolve();
    }
  });

  return d.promise;
};

/**
 * Publishes a pact. If called without any paramaters, will used enqueued
 * parameters
 * @param  {String}   pactFileName  The pact file to publish. Optional
 *                                  parameter.
 * @return {Promise}                Promise to the number of pacts published
 */
PactPublisher.prototype.publish = function (pactFileName) {
  var self = this;
  var d = Q.defer();

  if (_.isString(pactFileName)) {
    this._enqueuedPactFiles.push(pactFileName);
  }
  if (this._enqueuedPactFiles.length === 0) {
    this._log('No pacts to publish', 'warn');
    d.resolve(0);
  }

  // Load in each of our pacts
  var fileLoadPromises = this._enqueuedPactFiles.map(function (pactFileName) {
    return self._loadPactFile(pactFileName);
  });
  Q.all(fileLoadPromises).then(function (pacts) {
    // Reset enqueued files
    self._enqueuedPactFiles = [];
    // Queue up a whole bunch of promises to be published
    var publishPromises = pacts.map(function (pact) {
      return self._publish(pact);
    });
    Q.all(publishPromises).then(function (responses) {
      self._log('Successfully published ' + responses.length + ' pact(s)!', 'mark');
      d.resolve(responses.length);
    }, function (responses) {
      self._log('Failed to publish all pact contracts. Only ' + responses.length + ' pact(s) were published.', 'error');
      d.reject(responses.length);
    });
  }, function (err) {
    self._log('Failed to load pact contract' + err, 'error');
  });

  return d.promise;
};

module.exports = PactPublisher;