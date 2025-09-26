# Script Composer SDK Node.js Example

This example demonstrates how to use the Script Composer SDK in a Node.js environment to build and simulate transactions on the Aptos blockchain.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn

## Installation

1. Navigate to the example directory:
```bash
cd examples/nodejs
```

2. Install dependencies:
```bash
npm install
```

## Running the Example

To run the example:

```bash
tsx index.ts
```

## What This Example Does

This example demonstrates:

1. Fetching a module from the Aptos blockchain
2. Building a transaction using the Script Composer SDK
3. Simulating the transaction on the Aptos testnet

The example specifically:
- Fetches the `aptos_account` module from the Aptos blockchain
- Creates a transaction that attempts to transfer 1 APT from account `0x1` to itself
- Simulates the transaction to see the expected outcome

## Code Structure

- `index.ts`: Contains the main example code
- `package.json`: Defines project dependencies

## Dependencies

The example uses the following main dependencies:
- `script-composer-sdk`: For building transactions
- `@aptos-labs/ts-sdk`: For interacting with the Aptos blockchain
- `@aptos-labs/script-composer-pack`: For transaction building utilities 