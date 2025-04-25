"use strict";

const { Client, XFER } = require('./client.js');

const net = require('./fakeNet.js');


// If a cheater is detected, strict clients will delete
// the cheaters funds and refuse to accept any more transactions
// from them.
class StrictClient extends Client {
  punishCheater(name) {
    this.log(`Client ${name} is a cheater.  The wicked will be punished.`);
    delete this.ledger[name];
    delete this.clients[name];
  }
}

// Alice is the first client -- she starts with a special ledger.
let alice = new StrictClient('Alice', net);
alice.ledger = {
  'Alice': 800,
};
alice.clients = {
  'Alice': alice.keypair.public,
};

// Bob, Charlie, and Trudy join the network.
let bob = new StrictClient('Bob', net);
let charlie = new StrictClient('Charlie', net);
let trudy = new StrictClient('Trudy', net);

// Alice gives funds to the others
alice.give('Bob', 150);
alice.give('Charlie', 75);
alice.give('Trudy', 250);
bob.give('Charlie', 15);
console.log();

// Trudy joins the network.

alice.showLedger();
bob.showLedger();
charlie.showLedger();
trudy.showLedger();
console.log();


// Trudy give Bob some money, but only so that Bob is aware.
trudy.fakeGive = function(name, amount) {
  //
  // ***YOUR CODE HERE***

  let message = {
    from: this.name,
    to: name,
    amount: amount,
  };
  
  // Sign the message to make it valid
  let signature = this.signObject(message);
  
  // Instead of broadcasting to all clients, send only to Bob
  // Use the 'send' function from fakeNet instead of broadcast
  net.send(name, XFER, {message: message, signature: signature});
  
  // Log the fake transaction for clarity
  this.log(`Secretly sent ${amount} to ${name}`);
  

  //
}


// Trudy sends fake money to Bob
trudy.fakeGive('Bob', 100);

// Bob tries to spend the fake money
bob.give('Charlie', 200);

console.log();
alice.showLedger();
charlie.showLedger();
trudy.showLedger();
bob.showLedger();