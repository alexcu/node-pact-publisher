var should = require('should');
var PactPublisher = require('../lib/pact-publisher');

describe('Constructor', function () {
  var version = '1.2.3';
  var brokerBaseUrl = 'http://192.168.99.100';
  var pactsDir = __dirname;
  var pactsFiles = [__dirname + '/sample-pact.json']
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