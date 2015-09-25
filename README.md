# Node Pact Publisher
Publishes [pact](https://github.com/bethesque/pact-specification) contracts to a remote pact [broker](https://github.com/bethesque/pact_broker) using Node.

# Using Pact Publisher

## Constructing a new publisher

Construct a new publisher using either a `config` object:

```javascript
var PactPublisher = require('pact-publisher');
var config = {
  // Version of your application to be published
  appVersion: '1.2.3',
  // Url of the remote pact broker
  brokerBaseUrl: 'http://remote.pact.broker',
  // Path containing JSON pact contracts
  pacts: 'path/to/pacts'
};
var myPublisher = new PactPublisher(config);
```

or by using arguments:

```javascript
var PactPublisher = require('pact-publisher');
var myPublisher   = new PactPublisher(
  // Argument 1: version of your application to be published
  '1.2.3',
  // Argument 2: url of the remote pact broker
  'http://remote.pact.broker',
  // Argument 3: Path containing JSON pact contracts
  'path/to/pacts'
);
```

### Can I provide specific pact contracts instead of a path to contracts?

Yes, just provide an array for `pacts` or the third argument in the constructor:

```javascript
var pactsToPublish = [
  'path/to/pacts/consumer_1-to-provider_1.json',
  'path/to/pacts/consumer_2-to-provider_2.json'
];

var myPublisherUsingConfig = new PactPublisher({
  appVersion: '1.2.3',
  brokerBaseUrl: 'http://remote.pact.broker',
  pacts: pactsToPublish
});

var myPublisherUsingArguments = new PactPublisher('1.2.3', 'http://remote.pact.broker', pactsToPublish);
```

### Can I disable logging?

Yep - you will need to construct the Pact Publisher using a config object. Provide a `logging` key with a value of `false`:

```javascript
var myPublisherUsingConfig = new PactPublisher({
  appVersion: '1.2.3',
  brokerBaseUrl: 'http://remote.pact.broker',
  pacts: 'path/to/pacts',
  logging: false
});
```

### Can I use an `appVersion` in my `package.json` file?

Of course! If you'd like to use the version of your app from `package.json`, just load it in:

```javascript
var myAppVersion = require('./path/to/package.json').version;
var myPublisher  = new PactPublisher(myAppVersion, 'http://remote.pact.broker');
```

Pact Publisher doesn't automatically do this for you in case you're not using a node application, but would like to publish using this simple node library.

## Publishing pacts to the broker

TODO - Write up Readme

## Registering new pacticipants on the broker

TODO - Write up Readme

## Checking for pacticipants on the broker

TODO - Write up Readme

# Contributing

1. Fork this repo
2. Checkout a new feature or fix branch: `feature/<my-feature-name>` or `fix/<issue>`
3. [Commit](http://chris.beams.io/posts/git-commit/) your changes
4. Create a pull request

# Licence

Copyright &copy; 2015 Alex Cummaudo. Licensed under the MIT license.
