"use strict";

const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

const XFER = 'XFER';

class Client {
  constructor(name, net) {
    this.name = name;
    this.net = net;
    this.keypair = nacl.sign.keyPair();
    this.ledger = {};
    this.clients = {};
    this.net.register(this);
  }

  sign(obj) {
    const msg = nacl.util.decodeUTF8(JSON.stringify(obj));
    const sig = nacl.sign.detached(msg, this.keypair.secretKey);
    return nacl.util.encodeBase64(sig);
  }

  verify(obj, sig, pubkey) {
    const msg = nacl.util.decodeUTF8(JSON.stringify(obj));
    const sigUint8 = nacl.util.decodeBase64(sig);
    return nacl.sign.detached.verify(msg, sigUint8, pubkey);
  }

  give(to, amount) {
    if (!this.ledger[this.name] || this.ledger[this.name] < amount) {
      console.log(`${this.name} has insufficient funds to give ${amount} to ${to}.`);
      return;
    }

    const msg = {
      from: this.name,
      to: to,
      amount: amount
    };
    const sig = this.sign(msg);
    this.net.broadcast(XFER, { message: msg, sig: sig });
  }

  receive(type, data) {
    if (type !== XFER) return;

    const { message, sig } = data;
    const { from, to, amount } = message;

    if (!this.clients[from]) {
      console.log(`${this.name} does not recognize sender ${from}.`);
      return;
    }

    const senderPubKey = this.clients[from];
    if (!this.verify(message, sig, senderPubKey)) {
      console.log(`${this.name} received an invalid signature from ${from}.`);
      return;
    }

    if (!this.ledger[from]) this.ledger[from] = 0;
    if (!this.ledger[to]) this.ledger[to] = 0;

    if (this.ledger[from] < amount) {
      console.log(`${this.name} sees that ${from} has insufficient funds.`);
      return;
    }

    this.ledger[from] -= amount;
    this.ledger[to] += amount;
  }

  showLedger() {
    console.log(`${this.name}'s ledger:`);
    for (const [client, balance] of Object.entries(this.ledger)) {
      console.log(`  ${client}: ${balance}`);
    }
  }
}

module.exports = { Client, XFER };
