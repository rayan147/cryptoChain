const crypto = require("crypto");
// using the rest pattern
const cryptoHash = (...inputs) => {
  const hash = crypto.createHash("sha256");
  hash.update(inputs.sort().join(" "));
  return hash.digest("hex");
};

module.exports = cryptoHash;
