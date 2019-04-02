const PubNub = require("pubnub");

const credentials = {
  publishKey: "pub-c-2651b5a8-cfc0-47aa-b5b9-5c9ac07a9838",
  subscribeKey: "sub-c-0e36a3e0-5362-11e9-9a07-6e9fe698c560",
  secretKey: "sec-c-ZTA0NzBhZjYtYWM4MC00ZDg0LTkxYzQtMzdiZWE3YzQzNGRh"
};

const CHANNELS = {
  TEST: "TEST",
  BLOCKCHAIN: "BLOCKCHAIN",
  TRANSACTION: "TRANSACTION"
};

class PubSub {
  constructor({ blockchain, transactionPool, wallet }) {
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;
    this.wallet = wallet;

    this.pubnub = new PubNub(credentials);

    this.pubnub.subscribe({ channels: [Object.values(CHANNELS)] });

    this.pubnub.addListener(this.listener());
  }

  broadcastChain() {
    this.publish({
      channel: CHANNELS.BLOCKCHAIN,
      message: JSON.stringify(this.blockchain.chain)
    });
  }

  broadcastTransaction(transaction) {
    this.publish({
      channel: CHANNELS.TRANSACTION,
      message: JSON.stringify(transaction)
    });
  }

  subscribeToChannels() {
    this.pubnub.subscribe({
      channels: [Object.values(CHANNELS)]
    });
  }

  listener() {
    return {
      message: messageObject => {
        const { channel, message } = messageObject;
        console.log(
          `Message received. Channel: ${channel}. Message: ${message}`
        );
        const parsedMessage = JSON.parse(message);

        switch (channel) {
          case CHANNELS.BLOCKCHAIN:
            this.blockchain.replaceChain(parsedMessage, true, () => {
              this.transactionPool.clearBlockchainTransactions({
                chain: parsedMessage.chain
              });
            });
            break;
          case CHANNELS.TRANSACTION:
            if (
              !this.transactionPool.existingTransaction({
                inputAddress: this.wallet.publicKey
              })
            ) {
              this.transactionPool.setTransaction(parsedMessage);
            }
            break;
          default:
            return;
        }
      }
    };
  }

  publish({ channel, message }) {
    // there is an unsubscribe function in pubnub
    // but it doesn't have a callback that fires after success
    // therefore, redundant publishes to the same local subscriber will be accepted as noisy no-ops
    this.pubnub.publish({ message, channel });
  }

  broadcastChain() {
    this.publish({
      channel: CHANNELS.BLOCKCHAIN,
      message: JSON.stringify(this.blockchain.chain)
    });
  }

  broadcastTransaction(transaction) {
    this.publish({
      channel: CHANNELS.TRANSACTION,
      message: JSON.stringify(transaction)
    });
  }
}

module.exports = PubSub;
