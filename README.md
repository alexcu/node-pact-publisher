# Node Pact Publisher
Publishes [pact](https://github.com/bethesque/pact-specification) contracts to a remote pact [broker](https://github.com/bethesque/pact_broker) using Node.

[![NPM version](https://badge.fury.io/js/node-pact-publisher.svg)](http://badge.fury.io/js/node-pact-publisher)

- [Installing](#installing)
- [Using Pact Publisher](#using-pact-publisher)
  - [Constructing a new publisher](#constructing-a-new-publisher)
  - [Publishing pacts to the broker](#publishing-pacts-to-the-broker)
  - [Registering new pacticipants on the broker](#registering-new-pacticipants-on-the-broker)
  - [Checking for pacticipants on the broker](#checking-for-pacticipants-on-the-broker)
- [Example](#example)
- [Contributing](#contributing)
  - [Testing](#testing)
- [Licence](#licence)

**Features**

- Publish pact JSON contracts easily with a broker in JavaScript/CoffeeScript
- Integrate publishing into your Node application
- Register pacticipants with your brokers
- Easily retrieve pacticipants from your brokers

# Installing

Run to install and save to your `package.json` file using `npm`:

```bash
$ npm install --save-dev node-pact-publisher
```

# Using Pact Publisher

## Constructing a new publisher

Construct a new publisher using either a config object:

```javascript
var PactPublisher = require('pact-publisher');
var config = {
  // Version of your application to be published
  appVersion: '1.2.3',
  // Url of the remote pact broker
  brokerBaseUrl: 'http://remote.pact.broker',
  // Path containing JSON pact contracts (optional)
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
  // Argument 3: Path containing JSON pact contracts (optional)
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

### Can I use the `version` field in my `package.json` file for `appVersion`?

Of course! If you'd like to use the version of your app from `package.json`, just load it in:

```javascript
var myAppVersion = require('./path/to/package.json').version;
var myPublisher  = new PactPublisher(myAppVersion, 'http://remote.pact.broker');
```

Pact Publisher doesn't automatically do this for you in case you're not using a node application, but would like to publish using this simple node library.

## Publishing pacts to the broker

To publish your pacts, populate the files you want to publish in the [constructor](#constructing-a-new-publisher) under the `pacts` key/argument, then simply call the `publish` method on your publisher to let the magic happen!

```javascript
var myPublisher = new PactPublisher({
  appVersion: '1.2.3',
  brokerBaseUrl: 'http://remote.pact.broker',
  pacts: ['path/to/pacts/my_consumer-my_provider.json']
});
```

If you don't specify anything for the optional `pacts` argument, you can call publish with a file name path instead:

```javascript
var myPublisher = new PactPublisher({
  appVersion: '1.2.3',
  brokerBaseUrl: 'http://remote.pact.broker'
});
myPublisher.publish('path/to/pacts/my_consumer-my_provider.json').;
```

The `publish` function returns a promise to the number of pacts successfully published. Pact publisher uses [promises](https://www.npmjs.com/package/q) to handle responses, rather than using callbacks. If you are unfamilar with the concept of promises, you can read more about them [here](https://gist.github.com/wavded/2a6c433598bb8a1746cf#promises-in-the-abstract).

```javascript
myPublisher.publish().then(function (numberOfPactsPublished) {
  // Successful publish
  console.info('Congrats! ' + numberOfPactsPublished + ' pacts were published!');
}, function (numberOfPactsPublished) {
  // Partial publish
  console.error('Not all pacts were published, but ' + numberOfPactsPublished + ' were');
});
```

## Registering new pacticipants on the broker

You can also use Pact Publisher to register your consumer or providers on brokers. This can be done using the `registerPacticipant` method, which returns a promise to the 'pacticipant' published, or an error message.

```javascript
myPublisher.registerPacticipant('My Awesome Provider').then(function (pactInfo) {
  // Successful registration
  console.info('My Awesome Provider was successfully published:', pactInfo);
}, function (err) {
  // Error in registration
  console.error('Error occurred during pact registration:', err);
});
```

## Checking for pacticipants on the broker

Similar to [registering](#registering-new-pacticipants-on-the-broker) pacts, you can check which pacticipants already exist in the broker, or even check if your pacticipants is registered first. Use the `getPacticipantNames` or `isPacticipantRegistered` methods to do so. Both return promises for data or errors.

```javascript
// Getting all pacticipants
myPublisher.getPacticipantNames().then(function (pacticipantNames) {
  // Successful data retrieval
  console.info('The pact broker at has the following pacticipants:', pactInfo);
}, function (err) {
  // Error in data retrieval
  console.error('Error occurred:', err);
});

// Checking if pacticipant is already registered
myPublisher.isPacticipantRegistered('My Provider').then(function (isRegistered) {
  // Successful data retrieval
  console.info('My Provider has', (isRegistered ? '' : 'not'), 'been registered');
}, function (err) {
  // Error in data retrieval
  console.error('Error occurred:', err);
});
```

# Example

A sample of the publisher is provided under the `example` folder.

To run the example use:

```bash
$ node example --broker http://remote.pact.broker
```

where `http://remote.pact.broker` is the url of the pact broker to publish to. You can set up a mock pact broker server by following instructions [here](https://github.com/bethesque/pact_broker#to-have-a-play-around-on-your-local-machine).

This example will publish all pact contracts under `exmaple/pacts`.

# Contributing

Have an idea to extend this project or discover a bug? Feel free to contribute or raise an issue!

To extend the code base, use the following steps:

1. Fork this repo,
2. checkout a new feature or fix branch: `feature/<my-feature-name>`, `fix/<issue>` etc.,
3. commit your changes. A good guide to commit messages can be found [here](http://chris.beams.io/posts/git-commit/),
4. and create a pull request.

## Testing

To run tests use:

```bash
$ npm test
```

Note you will need to setup a mock broker server. Follow the setup instructions found [here](https://github.com/bethesque/pact_broker#to-have-a-play-around-on-your-local-machine) to set one up.

# Licence

Copyright &copy; 2015 Alex Cummaudo. Licensed under the MIT license.

