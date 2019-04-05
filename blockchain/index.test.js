const Blockchain = require("./index");
const Block = require("./block");
const { cryptoHash } = require("../util");

describe("Blockchian", () => {
  let blockchain, newChain, orginalChain;

  beforeEach(() => {
    blockchain = new Blockchain();
    newChain = new Blockchain();
    orginalChain = blockchain.chain;
  });

  it("expects a `chain` Array instance", () => {
    expect(blockchain.chain instanceof Array).toBe(true);
  });
  it("starts with the genesis block", () => {
    expect(blockchain.chain[0]).toEqual(Block.genesis());
  });
  it("adds a new block to chain", () => {
    const newData = "foo bar";
    blockchain.addBlock({ data: newData });

    expect(blockchain.chain[blockchain.chain.length - 1].data).toEqual(newData);
  });
  describe("isValidChain()", () => {
    describe("when the does not start with genesis block", () => {
      it("returns false chain", () => {
        blockchain.chain[0] = { data: "fake-genesis" };
        expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
      });
    });
    describe("when the chain starts with genesis block and has multiple blocks", () => {
      beforeEach(() => {
        blockchain.addBlock({ data: "Bears" });
        blockchain.addBlock({ data: "Beets" });
        blockchain.addBlock({ data: "Battlestar Galatica" });
      });
      describe("and lastHash reference has changed", () => {
        it("returns false ", () => {
          blockchain.chain[2].lastHash = "broken-lastHash";

          expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
        });
      });
      describe("and the chain contains an invalid fields", () => {
        it("returns false", () => {
          blockchain.chain[2].data = "some-bad-and-evil-data";
          expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
        });
        describe(" and the chain contains a block jumped difficulty ", () => {
          it("returns false ", () => {
            const lastBlock = blockchain.chain[blockchain.chain.length - 1];
            const lastHash = lastBlock.hash;
            const timestamp = Date.now();
            const nonce = 0;
            const data = [];
            const difficulty = lastBlock.difficulty - 3;
            const hash = cryptoHash(
              timestamp,
              lastHash,
              data,
              nonce,
              difficulty
            );

            const badBlock = new Block({
              timestamp,
              lastHash,
              hash,
              data,
              nonce,
              difficulty
            });
            blockchain.chain.push(badBlock);
            expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
          });
        });
        describe("and the chain does not contains any invalid blocks", () => {
          it("returns true", () => {
            expect(Blockchain.isValidChain(blockchain.chain)).toBe(true);
          });
        });
      });
    });
    describe("replaceChain()", () => {
      let errorMock, logMock;

      beforeEach(() => {
        errorMock = jest.fn();
        logMock = jest.fn();

        global.console.error = errorMock;
        global.console.log = logMock;
      });

      describe("when the new chain is not longer", () => {
        beforeEach(() => {
          newChain.chain[0] = { new: "chain" };

          blockchain.replaceChain(newChain.chain);
        });
        it("does not replace the chain", () => {
          expect(blockchain.chain).toEqual(orginalChain);
        });
        it("logs an error ", () => {
          expect(errorMock).toHaveBeenCalled();
        });
      });

      describe("when the  new chain is longer", () => {
        beforeEach(() => {
          newChain.addBlock({ data: "Bears" });
          newChain.addBlock({ data: "Beets" });
          newChain.addBlock({ data: "Battlestar Galatica" });
        });
        describe("and the chain is invalid", () => {
          beforeEach(() => {
            newChain.chain[2].hash = "some-fake-hash";
            blockchain.replaceChain(newChain.chain);
          });
          it("does not replace the chain", () => {
            expect(blockchain.chain).toEqual(orginalChain);
          });
          it("logs an error ", () => {
            expect(errorMock).toHaveBeenCalled();
          });
        });

        describe("and the chain is valid ", () => {
          beforeEach(() => {
            blockchain.replaceChain(newChain.chain);
          });
          it("replaces the chain", () => {
            expect(blockchain.chain).toEqual(newChain.chain);
          });
          it("the chain has been replaced", () => {
            expect(logMock).toHaveBeenCalled();
          });
        });
      });
    });
  });
});
