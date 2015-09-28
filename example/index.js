/*
 * Node Pact Publisher Example
 * https://github.com/alexcu-/node-pact-publisher
 *
 * Copyright (c) 2015 Alex Cummaudo.
 * Licensed under the MIT license.
 */
var PactPublisher = require('../lib/pact-publisher');
var Q             = require('q');

// Input for broker url
var argv = process.argv.slice(2);
if (argv[0] !== '--broker' || argv[1] === undefined) {
  throw new Error("Missing --broker argument");
}
var PACT_URL = argv[1];

// Get the consumer and provider name from our pact .json file
var PACTICIPANTS = [
  'A consumer',
  'Some provider'
];

// Source from the pacts directory
var PACT_DIR = __dirname + '/pacts';

// Construct the pact publisher
var myPublisher = new PactPublisher({
  appVersion: require(__dirname + '/package.json').version,
  brokerBaseUrl: PACT_URL,
  pacts: PACT_DIR
});

// Setup a convenience error handler
var errorHandler = function (err) {
  console.error('\x1b[31mERROR:', err, '\x1b[0m');
  process.nextTick(function (err) {
    throw new Error('An error has occurred while publishing');
  })
};

// Begin to publish it!
console.info("Publishing pacts from", PACT_DIR, "to", PACT_URL);

// Check to see if pacticipant exists (see note below)
var isRegisteredPromises = PACTICIPANTS.map(function (pacticipant) {
  return myPublisher.isPacticipantRegistered(pacticipant);
});

// Execute all register promises
Q.all(isRegisteredPromises)
  .then(function (isRegisteredResponses) {
    var registerPromises = [];
    // For all register responses
    isRegisteredResponses.forEach(function (isRegistered, i) {
      // If one of them wasn't registered
      if (!isRegistered) {
        var pacticipantName = PACTICIPANTS[i];
        console.info(pacticipantName, "isn't registered yet. Registering...");
        // Push a register promise to register the i'th pacticipant
        // that wasn't yet registered. This is because the broker will
        // reject us publishing a pact if a pacticipant is not yet
        // registered with it.
        registerPromises.push(myPublisher.registerPacticipant(pacticipantName));
      }
    });
    // Return a promise to register all pacticipants, or an empty array of
    // promises to move onto the publishing promise
    return Q.all(registerPromises);
  }, errorHandler)
  .then(function (registerInfo) {
    // Publish all the pacts when we're done with registering (if need be)
    return myPublisher.publish();
  }, errorHandler)
  .then(function (pactsPublished) {
    // And we're done!
    console.info('Finished!');
  }, errorHandler);