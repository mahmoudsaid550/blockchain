"use strict";

// npm install blind-signatures
const blindSignatures = require('blind-signatures');

const { Coin, COIN_RIS_LENGTH, IDENT_STR, BANK_STR } = require('./coin.js');
const utils = require('./utils.js');

// ======== BANK KEY GENERATION ========
const BANK_KEY = blindSignatures.keyGeneration({ b: 2048 });
const N = BANK_KEY.keyPair.n.toString();
const E = BANK_KEY.keyPair.e.toString();

// ======== SIGN COIN FUNCTION ========
function signCoin(blindedCoinHash) {
  return blindSignatures.sign({
    blinded: blindedCoinHash,
    key: BANK_KEY,
  });
}

// ======== PARSE COIN STRING FUNCTION ========
function parseCoin(s) {
  let [cnst, amt, guid, leftHashes, rightHashes] = s.split('-');
  if (cnst !== BANK_STR) {
    throw new Error(`Invalid identity string: ${cnst} received, but ${BANK_STR} expected`);
  }
  let lh = leftHashes.split(',');
  let rh = rightHashes.split(',');
  return [lh, rh];
}

// ======== MERCHANT ACCEPTS COIN FUNCTION ========
function acceptCoin(coin) {
  // Verify the bank's signature on the coin
  if (!blindSignatures.verify({
    unblinded: coin.signature,
    N: BANK_KEY.keyPair.n,
    E: BANK_KEY.keyPair.e,
    message: coin.toString(),
  })) {
    throw new Error("Invalid coin signature.");
  }

  // Parse coin identity hashes
  let [leftHashes, rightHashes] = parseCoin(coin.toString());

  // Randomly choose left or right half
  let selectedHalf = Math.random() < 0.5 ? leftHashes : rightHashes;
  return selectedHalf;
}

// ======== DETECT DOUBLE SPENDER FUNCTION ========
function determineCheater(guid, ris1, ris2) {
  let cheaterIdentified = false;
  for (let i = 0; i < ris1.length; i++) {
    let xorValue = utils.hash(utils.xorStrings(ris1[i], ris2[i]));
    if (xorValue.startsWith(utils.hash(IDENT_STR).substring(0, 5))) {
      console.log(`Double-spender identified: ${xorValue.substring(5)}`);
      cheaterIdentified = true;
      break;
    }
  }
  if (!cheaterIdentified) {
    console.log("The merchant attempted fraud.");
  }
}

// ======== DRIVER CODE ========

// Create a coin for 'alice' worth 20 units
let coin = new Coin('alice', 20, N, E);

// Bank signs the blinded hash
coin.signature = signCoin(coin.blinded);

// Unblind the signature (get usable signed coin)
coin.unblind();

// Merchant 1 accepts the coin (reveals one side of identity)
let ris1 = acceptCoin(coin);

// Merchant 2 also accepts the **same coin** (reveals another side)
let ris2 = acceptCoin(coin);

// Bank detects coin used twice, checks RIS parts and finds the double spender
console.log("== Double Spending Check ==");
determineCheater(coin.guid, ris1, ris2);

// Check false case: RIS strings are the same — looks like merchant tried to cheat
console.log("\n== False Double Spending Check ==");
determineCheater(coin.guid, ris1, ris1);
