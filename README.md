# Hive Payment Smart Contract

The payment smart contract for Hive storage service when users need to upgrade the pricing plan or require more storage quatos from Hive node being used.

### How To Build

### Prepare for enviroment
Clone the repository onto your local device, and install all depedencies

```shell
$ git clone https://github.com/elastos-trinity/Elastos.Hive.Payment.git
$ npm install
```

then, configurate hardhat.config.js, put your private key in the network config item

```javascript
module.exports = {
  solidity: {
    version: "0.7.6",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    elastosmainnet: {
      url: "https://api.elastos.io/esc",
      accounts: [],
    },
    elastostestnet: {
      url: "https://api-testnet.elastos.io/eth",
      accounts: [],
    },
  },
  contractAddress: '',
  platformAddress: '',
  platformFeeRate: 5,
  testAddress1: '',
  testAddress2: '',
  testAddress3: '',
};
```

**Notice**: *put your private key string in the item "accounts"*.

### Testing
Run the following command in the terminal to start testing on testnet enviroment.
```shell
$ npx hardhat test
```

### Deploy contracts
Deploy contracts by running such command in terminal
```shell
$ npx hardhat run scripts/deploy.js --network elastostestnet
```



## Contribution

Any contributions  to this repository would be highly appreciated, including
- Improving README
- More test cases
- Report bug and bugfix

The contribution acitivities can be either by creating an issue or pushing a pull request.


## License

This project is licensed under the terms of the [MIT license](https://github.com/elastos-trinity/Elastos.Hive.Payment/blob/main/LICENSE).
