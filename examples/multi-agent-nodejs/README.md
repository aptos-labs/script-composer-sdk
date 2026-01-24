# Script Composer SDK - Multi-Agent Transaction Example

This example demonstrates how to use the Script Composer SDK to build multi-agent transactions on the Aptos blockchain. Multi-agent transactions allow multiple signers to participate in a transaction, with optional fee payer support for sponsored transactions.

## Overview

Multi-agent transactions are a powerful feature of the Aptos blockchain that enable:
- **Multiple Signers**: Transactions that require approval from multiple parties
- **Sponsored Transactions**: Transactions where a third party pays for gas fees
- **Complex Workflows**: Support for sophisticated transaction patterns

## Prerequisites

- Node.js (v16 or higher)
- npm, yarn, or pnpm
- Access to Aptos Testnet (for testing)

## Installation

1. Navigate to the example directory:
```bash
cd examples/multi-agent-nodejs
```

2. Install dependencies from the workspace root:
```bash
# From the repository root
pnpm install
```

Or install directly in this directory:
```bash
npm install
# or
yarn install
# or
pnpm install
```

## Running the Example

To run all examples:

```bash
pnpm start
# or
npm run start
# or
tsx index.ts
```

## Examples Included

This example demonstrates four different multi-agent transaction scenarios:

### Example 1: Basic Multi-Agent Transaction

Creates a multi-agent transaction with only a sender (no secondary signers, no fee payer). This demonstrates the minimal multi-agent transaction setup.

**Key Features:**
- Single sender
- No secondary signers
- No fee payer
- Minimal configuration

**Use Cases:**
- Testing multi-agent transaction structure
- Understanding basic multi-agent setup
- Preparing for more complex scenarios

### Example 2: Multi-Agent with Secondary Signers

Creates a multi-agent transaction with a sender and multiple secondary signers. This shows how to add additional signers to a transaction.

**Key Features:**
- Primary sender
- One or more secondary signers
- No fee payer
- Multiple approvals required

**Use Cases:**
- Multi-signature wallets
- Governance transactions requiring multiple approvals
- Escrow services
- Shared account management

### Example 3: Multi-Agent with Fee Payer (Sponsored Transaction)

Creates a multi-agent transaction with a sender and a fee payer. This demonstrates sponsored transaction pattern where a third party pays for gas.

**Key Features:**
- Primary sender
- Fee payer (sponsor)
- No secondary signers
- Gas fees paid by sponsor

**Use Cases:**
- User onboarding (dApp pays for first transactions)
- Promotional campaigns
- Reducing user friction
- Enterprise applications

### Example 4: Complete Multi-Agent Transaction

Creates a full multi-agent transaction with sender, secondary signers, and fee payer. This demonstrates the most complex multi-agent transaction structure.

**Key Features:**
- Primary sender
- Multiple secondary signers
- Fee payer (sponsor)
- Complete multi-agent setup

**Use Cases:**
- Complex governance workflows
- Enterprise multi-party transactions
- Advanced dApp features
- Sophisticated transaction patterns

## Code Structure

```
multi-agent-nodejs/
├── index.ts          # Main example file with all four scenarios
├── package.json      # Project dependencies
└── README.md         # This documentation
```

## Key Concepts

### Multi-Agent Transactions

Multi-agent transactions differ from simple transactions in that they:
- Support multiple signers (primary sender + secondary signers)
- Can have a fee payer separate from the sender
- Require signatures from all parties before execution
- Enable complex transaction workflows

### Transaction Building Process

1. **Fetch Module**: Get the required Move module from the blockchain
2. **Build Transaction**: Use `BuildScriptComposerMultiAgentTransaction` to construct the transaction
3. **Configure Signers**: Specify primary sender, secondary signers, and optional fee payer
4. **Add Function Calls**: Use the composer to add batched function calls
5. **Return Transaction**: Get the `MultiAgentTransaction` object ready for signing

### Signing and Submission

**Note**: This example only builds transactions. To actually submit them:

1. Sign the transaction with the sender's private key
2. Sign with all secondary signers' private keys
3. Sign with the fee payer's private key (if applicable)
4. Submit the fully signed transaction to the network

For simulation, use `aptos.transaction.simulate.multiAgent()` with the appropriate public keys.

## API Reference

### BuildScriptComposerMultiAgentTransaction

```typescript
BuildScriptComposerMultiAgentTransaction(args: {
  sender: AccountAddressInput;                    // Required: Primary sender address
  builder: (composer: AptosScriptComposer) => Promise<AptosScriptComposer>;  // Required: Builder function
  aptosConfig: AptosConfig;                       // Required: Aptos configuration
  options?: InputGenerateTransactionOptions;       // Optional: Transaction options
  secondarySignerAddresses?: Array<AccountAddressInput>;  // Optional: Secondary signer addresses
  feePayerAddress?: AccountAddressInput;          // Optional: Fee payer address
}): Promise<MultiAgentTransaction>
```

### Parameters

- **sender** (required): The primary account address that will sign the transaction
- **builder** (required): Async function that receives and returns an `AptosScriptComposer` instance
- **aptosConfig** (required): Aptos configuration for network and API settings
- **options** (optional): Transaction generation options (gas price, expiration, etc.)
- **secondarySignerAddresses** (optional): Array of secondary signer addresses for multi-agent transactions
- **feePayerAddress** (optional): Account address that sponsors the transaction's gas fees

### Return Value

Returns a `MultiAgentTransaction` object containing:
- `rawTransaction`: The raw transaction data
- `secondarySignerAddresses`: Array of secondary signer addresses
- `feePayerAddress`: Optional fee payer address

## Dependencies

The example uses the following main dependencies:

- **@aptos-labs/script-composer-sdk**: For building multi-agent transactions
- **@aptos-labs/ts-sdk**: For interacting with the Aptos blockchain
- **tsx**: For running TypeScript files directly

## Important Notes

### Test Addresses

The example uses test addresses (`0x1`, `0x2`, etc.) for demonstration purposes. In production:
- Use actual account addresses
- Ensure accounts have sufficient balance
- Verify account permissions

### Transaction Signing

This example only builds transactions. To actually execute them:
- Sign with the sender's private key
- Sign with all secondary signers' private keys
- Sign with the fee payer's private key (if applicable)
- Submit the fully signed transaction

### Network Configuration

The example uses `Network.TESTNET` by default. To use a different network:
- Change `Network.TESTNET` to `Network.MAINNET` or `Network.DEVNET`
- Ensure you have access to the selected network
- Update any network-specific addresses or configurations

### Error Handling

The examples include basic error handling. In production:
- Implement comprehensive error handling
- Validate all inputs
- Handle network errors gracefully
- Provide user-friendly error messages

## Next Steps

After understanding these examples, you can:

1. **Sign Transactions**: Learn how to sign multi-agent transactions with multiple keys
2. **Submit Transactions**: Submit signed transactions to the Aptos network
3. **Simulate Transactions**: Use `aptos.transaction.simulate.multiAgent()` to test before submission
4. **Build Complex Flows**: Create sophisticated multi-agent transaction workflows for your dApp
5. **Integrate with Wallets**: Connect with wallet providers for signing
6. **Handle Errors**: Implement robust error handling and user feedback

## Additional Resources

- [Aptos Documentation](https://aptos.dev/)
- [Script Composer SDK Documentation](../../README.md)
- [Aptos TypeScript SDK](https://github.com/aptos-labs/aptos-ts-sdk)
- [Multi-Agent Transaction Guide](https://aptos.dev/guides/transaction-management)

## Troubleshooting

### Common Issues

**Issue**: "Module not found"
- **Solution**: Ensure the module exists on the network and the address is correct

**Issue**: "Invalid address format"
- **Solution**: Verify addresses are in the correct format (0x prefix, valid hex)

**Issue**: "Insufficient balance"
- **Solution**: Ensure accounts have sufficient balance for gas fees

**Issue**: "Transaction build failed"
- **Solution**: Check all parameters are valid and the builder function is correct

## Support

For issues and questions:
- Check the [main repository README](../../README.md)
- Review the [Aptos documentation](https://aptos.dev/)
- Open an issue on GitHub
