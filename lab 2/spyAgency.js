"use strict";

class SpyAgency {
  constructor() {
    this.n = 9999991; 
    this.e = 65537;   
  }

  verifyContents(originalDocs) {
    originalDocs.forEach((doc, i) => {
      if (doc !== undefined) {
        console.log(`Verifying Document ${i}:`, doc);
        if (!/^The bearer of this signed document, .*, has full diplomatic immunity.$/.test(doc)) {
          throw new Error(`Document ${i} is invalid`);
        }
      }
    });
  }

  signDocument(blindedDocs, callback) {
    let selected = Math.floor(Math.random() * blindedDocs.length);
    console.log(`Agency selected ${selected}`);
    
    callback(selected, (factors, originalDocs) => {
      this.verifyContents(originalDocs);
      return `Signed(${blindedDocs[selected]})`;
    });
  }
}

module.exports = { SpyAgency };
