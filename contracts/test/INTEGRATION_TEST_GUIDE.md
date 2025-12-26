# FHE Integration Test Guide

## Overview

The `UniqueTreasure.test.ts` file contains unit tests that verify contract structure, state management, and access control. However, **true FHE operation tests** require integration with the FHEVM coprocessor on Sepolia testnet.

## Why Separate Integration Tests?

FHE operations (`FHE.randEuint8()`, `FHE.eq()`, `FHE.select()`, etc.) cannot be executed in Hardhat's local test environment because:

1. FHE operations require the FHEVM coprocessor running on Sepolia
2. Encrypted inputs must be generated using `@zama-fhe/relayer-sdk`
3. Decryption requires EIP-712 signatures and relayer interaction

## Unit Tests (Current)

The current test suite covers:
- ✅ Contract deployment
- ✅ Initial state verification
- ✅ Function signatures
- ✅ Access control
- ✅ State management (hasPlayed, resetGame)
- ✅ Event definitions
- ✅ Edge cases

## Integration Tests (Required for Full Coverage)

To test actual FHE operations, create a separate integration test script:

### Setup

1. Install dependencies:
```bash
npm install @zama-fhe/relayer-sdk ethers
```

2. Create `contracts/test/integration.test.ts`:

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";
import { initSDK, createInstance, SepoliaConfig } from "@zama-fhe/relayer-sdk/web";

describe("UniqueTreasure Integration Tests", function () {
  // These tests require:
  // 1. Sepolia testnet connection
  // 2. Wallet with Sepolia ETH
  // 3. FHEVM SDK initialized
  
  it("Should play game with encrypted input", async function () {
    // 1. Deploy contract on Sepolia
    const contract = await deployToSepolia();
    
    // 2. Initialize FHEVM SDK
    await initSDK({ thread: 0 });
    const fhevm = await createInstance(SepoliaConfig);
    
    // 3. Encrypt user choice (1-4)
    const userAddress = await signer.getAddress();
    const input = fhevm.createEncryptedInput(contractAddress, userAddress);
    input.add8(BigInt(2)); // Choose chest #2
    const encrypted = await input.encrypt();
    
    // 4. Call play() with encrypted input
    const tx = await contract.play(
      `0x${Array.from(encrypted.handles[0]).map(b => b.toString(16).padStart(2, '0')).join('')}`,
      `0x${Array.from(encrypted.inputProof).map(b => b.toString(16).padStart(2, '0')).join('')}`
    );
    await tx.wait();
    
    // 5. Get encrypted result
    const resultHandle = await contract.getResult(userAddress);
    
    // 6. Decrypt result
    const { publicKey, privateKey } = fhevm.generateKeypair();
    const eip712 = fhevm.createEIP712(publicKey, [contractAddress]);
    const signature = await signer.signTypedData({
      domain: eip712.domain,
      types: eip712.types,
      primaryType: eip712.primaryType,
      message: eip712.message,
    });
    
    const decrypted = await fhevm.userDecrypt(
      [{ handle: resultHandle, contractAddress }],
      privateKey,
      publicKey,
      signature,
      [contractAddress],
      userAddress,
      String(eip712.message.startTimestamp),
      String(eip712.message.durationDays)
    );
    
    // 7. Verify result (0 = lose, 1 = win)
    expect(decrypted[resultHandle]).to.be.oneOf([0n, 1n]);
  });
  
  it("Should prevent double play without reset", async function () {
    // Test that play() reverts if hasPlayed is true
  });
  
  it("Should allow replay after reset", async function () {
    // Test resetGame() clears state
  });
  
  it("Should generate different random positions", async function () {
    // Test that FHE.randEuint8() produces different values
  });
});
```

### Running Integration Tests

```bash
# Set up environment
export SEPOLIA_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY"
export PRIVATE_KEY="your_test_wallet_private_key"

# Run integration tests (requires Sepolia connection)
npx hardhat test test/integration.test.ts --network sepolia
```

## Test Coverage Goals

### Unit Tests (Local Hardhat) ✅
- [x] Deployment
- [x] State management
- [x] Access control
- [x] Function signatures
- [x] Edge cases

### Integration Tests (Sepolia) ⚠️
- [ ] Encrypted input → play() → encrypted result
- [ ] Decryption of result
- [ ] Win/lose logic verification
- [ ] Random number generation
- [ ] Multiple players
- [ ] Reset functionality with encrypted data

## Notes

1. **Integration tests are expensive** - Each test requires Sepolia ETH for gas
2. **Relayer dependency** - Tests depend on Zama's relayer being available
3. **Timing** - FHE operations may take longer than standard transactions

## Alternative: Manual Testing

For development, manual testing via the frontend is often more practical:

1. Deploy contract to Sepolia
2. Use frontend to play game
3. Verify encrypted operations in browser console
4. Check contract state on Etherscan

This approach is faster and doesn't require automated test infrastructure.

