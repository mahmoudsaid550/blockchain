"use strict";

let blindSignatures = require('blind-signatures');
let SpyAgency = require('./spyAgency.js').SpyAgency;

function makeDocument(coverName) {
  return `The bearer of this signed document, ${coverName}, has full diplomatic immunity.`;
}

function blind(msg, n, e) {
  let { blinded, r } = blindSignatures.blind({
    message: msg,
    N: n,
    E: e,
  });
  console.log(`Blinding document: ${msg}`);
  console.log(`Blinded: ${blinded}, Blinding Factor: ${r}`);
  return { blinded, r };
}

function unblind(blindingFactor, sig, n) {
  let unblindedSig = blindSignatures.unblind({
    signed: sig,
    N: n,
    r: blindingFactor,
  });
  console.log(`Unblinded Signature: ${unblindedSig}`);
  return unblindedSig;
}

let agency = new SpyAgency();

let identities = ["Agent X", "Agent Y", "Agent Z", "Spy A", "Spy B", "Spy C", "Ghost", "Shadow", "Hawk", "Falcon"];
let blindDocs = [];
let blindingFactors = [];
let originalDocs = [];


identities.forEach(name => {
  let doc = makeDocument(name);
  let { blinded, r } = blind(doc, agency.n, agency.e);
  blindDocs.push(blinded);
  blindingFactors.push(r);
  originalDocs.push(doc);
});

console.log("\n Documents prepared and blinded successfully!\n");

agency.signDocument(blindDocs, (selected, verifyAndSign) => {
  console.log(`\n Agency selected document ${selected} for signing.\n`);

  let factorsForVerification = blindingFactors.map((factor, index) => index === selected ? undefined : factor);
  let docsForVerification = originalDocs.map((doc, index) => index === selected ? undefined : doc);

  let blindedSignature = verifyAndSign(factorsForVerification, docsForVerification);
  let finalSignature = unblind(blindingFactors[selected], blindedSignature, agency.n);

  console.log("\n Final Signature:", finalSignature);
});
