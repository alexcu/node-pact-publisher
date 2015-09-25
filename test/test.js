var should        = require('should');
var request       = require('request');
var Q             = require('q');
var PactPublisher = require('../lib/pact-publisher');

// Global test details
var version       = '1.2.3';
var brokerBaseUrl = 'http://localhost:8080';
var pactsDir      = __dirname;
var pactsFiles    = [__dirname + '/sample-pact-1.json', __dirname + '/sample-pact-2.json']
var pacticipant   = 'Pact Publisher Unit Test';

describe('Constructor', function () {
  it('should construct successfully using config object using directory', function () {
    var publisher = new PactPublisher({
      appVersion: version,
      brokerBaseUrl: brokerBaseUrl,
      pacts: pactsDir
    });
    publisher._appVersion.should.eql(version);
    publisher._pactBrokerBaseUrl.should.eql(brokerBaseUrl);
    publisher._pactUrl.should.eql(brokerBaseUrl + '/pacts/provider/{provider}/consumer/{consumer}/version/' + version);
    publisher._enqueuedPactFiles.should.eql(pactsFiles);
  });
  it('should construct successfully without config object using array of files', function () {
    var publisher = new PactPublisher(version, brokerBaseUrl, pactsFiles);
    publisher._appVersion.should.eql(version);
    publisher._pactBrokerBaseUrl.should.eql(brokerBaseUrl);
    publisher._pactUrl.should.eql(brokerBaseUrl + '/pacts/provider/{provider}/consumer/{consumer}/version/' + version);
    publisher._enqueuedPactFiles.should.eql(pactsFiles);
  });
});

describe('Registering', function () {
  var pactPublisher = new PactPublisher(version, brokerBaseUrl, pactsFiles);
  after(function (done) {
    // Delete 'Test Pack Name' to cleanup
    var uri = pactPublisher._pactBrokerBaseUrl + '/pacticipants/' + pacticipant;
    request.del(uri, done);
  });
  it('should be able to register', function () {
    return pactPublisher.registerPact(pacticipant).then(function (pact) {
      var required = (pact !== undefined && pact.name !== undefined);
      required.should.eql.true;
      pact.name.should.eql(pacticipant);
    }, function (err) {
      (err === undefined).should.eql(true);
    });
  });
  it('should be able to find a registered pacticipant', function () {
    return pactPublisher.isPacticipantRegistered(pacticipant).then(function (isRegistered) {
      isRegistered.should.eql(true);
    }, function (err) {
      (err === undefined).should.eql(true);
    });
  });
});

describe('Publishing', function () {
  var pactsToRegister = [
    'Pact Publisher Sample Test Consumer 1',
    'Pact Publisher Sample Test Provider 1',
    'Pact Publisher Sample Test Consumer 2',
    'Pact Publisher Sample Test Provider 2',
  ]
  var pactPublisher = new PactPublisher({
    appVersion: version,
    brokerBaseUrl: brokerBaseUrl,
    logging: true
  });
  var pactPublisherMulti = new PactPublisher({
    appVersion: version,
    brokerBaseUrl: brokerBaseUrl,
    pacts: pactsFiles,
    logging: true
  });
  // Register the pacticipants
  before(function (done) {
    var promises = pactsToRegister.map(function (pact) {
      return pactPublisher.registerPact(pact);
    });
    Q.all(promises).then(function () {
      done();
    });
  });
  // Cleanup the pacticipants
  after(function (done) {
    var uri = pactPublisher._pactBrokerBaseUrl + '/pacticipants/';
    for (i in pactsToRegister) {
      request.del(uri + pactsToRegister[i]);
    }
    setTimeout(done, 1950);
  });
  it('should be able to publish a single pact', function () {
    return pactPublisher.publish(pactsFiles[0]).then(function (publishCount) {
      publishCount.should.eql(1);
    }, function (publishCount) {
      publishCount.should.eql(undefined);
    });
  });
  it('should be able to publish multiple pacts', function () {
    return pactPublisherMulti.publish().then(function (publishCount) {
      publishCount.should.eql(2);
    }, function (publishCount) {
      publishCount.should.eql(undefined);
    });
  });
});