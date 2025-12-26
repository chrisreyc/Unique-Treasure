# 🎰 Unique Treasure

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Network](https://img.shields.io/badge/network-Sepolia-purple.svg)
![FHE](https://img.shields.io/badge/powered%20by-Zama%20FHEVM-green.svg)
![Solidity](https://img.shields.io/badge/solidity-0.8.24-lightgrey.svg)
![Next.js](https://img.shields.io/badge/next.js-14-black.svg)

A fun treasure hunt game where your choice stays secret, even from the blockchain itself! Pick a treasure chest, and discover if you found the hidden gem. Everything happens in encrypted form, powered by FHE, so your privacy is protected from start to finish.

## ✨ Features

- **🔐 End-to-End Encryption**: Your choice is encrypted in-browser using Zama's FHEVM SDK before it ever touches the blockchain. The smart contract never sees your plaintext choice.

- **🎲 On-chain Encrypted Randomness**: The treasure position is generated using `FHE.randEuint8()`, creating a truly random encrypted value that even the contract can't decrypt until you reveal it.

- **🔓 User-Controlled Decryption**: Only you can decrypt your result using EIP-712 signatures. The contract uses `FHE.allow()` to grant you exclusive access to decrypt your game outcome.

- **⚡ Seamless Gameplay**: A single transaction handles the entire flow: encryption, on-chain comparison, and encrypted result storage. Then decrypt in your browser to see if you won!

- **🛡️ True Privacy**: All sensitive operations (user choice, treasure position, comparison, result) happen entirely in encrypted form. No plaintext values are ever stored on-chain.

## 🛠 Tech Stack

### Smart Contract
- **Solidity 0.8.24** with **FHEVM v0.9**
- **FHE Operations**: 
  - `FHE.randEuint8()` — Generate encrypted random numbers
  - `FHE.eq()` — Compare encrypted values
  - `FHE.select()` — Conditional selection on encrypted data
  - `FHE.allow()` — Access control for decryption
- **Deployment**: Hardhat with Sepolia testnet
- **Testing**: 21 unit tests covering deployment, state management, and access control

### Frontend
- **Next.js 14** with App Router and TypeScript
- **Styling**: Tailwind CSS with custom maximalist design system
- **Animations**: Framer Motion for smooth interactions
- **Wallet Integration**: RainbowKit + wagmi v2 for seamless wallet connection
- **FHE SDK**: `@zama-fhe/relayer-sdk` v0.3.0 for browser-side encryption/decryption
- **State Management**: React hooks with proper FHE operation state tracking

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** (recommended: use nvm or fnm)
- **Wallet** with Sepolia testnet ETH (get free ETH from [Sepolia Faucet](https://sepoliafaucet.com/))
- **MetaMask** or any Web3 wallet supporting Sepolia network

### Frontend Setup

1. **Install dependencies**:
```bash
cd frontend
npm install
```

2. **Start development server**:
```bash
npm run dev
```

3. **Open browser**: Visit [http://localhost:3000](http://localhost:3000)

4. **Connect wallet**: Click "CONNECT" and switch to Sepolia network

The frontend will automatically initialize the FHEVM SDK when you load the page. You'll see a status indicator showing "FHE READY" when encryption is available.

### Contract Deployment

1. **Create environment file** (`contracts/.env`):
```env
PRIVATE_KEY=your_deployment_wallet_private_key
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your_alchemy_key
ETHERSCAN_API_KEY=your_etherscan_api_key
```

2. **Install dependencies**:
```bash
cd contracts
npm install
```

3. **Compile contracts**:
```bash
npm run compile
```

4. **Run tests** (optional but recommended):
```bash
npm test
```

5. **Deploy to Sepolia**:
```bash
npm run deploy
```

6. **Update frontend configuration**: 
   - Copy the deployed contract address
   - Update `frontend/src/lib/wagmi.ts` with the new address

7. **Verify on Etherscan** (important for transparency):
```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

## 🎮 How to Play

The game is simple but the technology behind it is revolutionary:

1. **Connect Your Wallet** 
   - Click the "CONNECT" button
   - Approve the connection in your wallet
   - Make sure you're on the **Sepolia testnet** (the UI will prompt you to switch)

2. **Start the Game**
   - Click "🎮 START" to begin
   - Wait for FHE initialization (you'll see "FHE READY" in the status bar)

3. **Pick a Treasure Chest**
   - Choose one of the 4 colorful treasure chests
   - Your choice is stored locally in your browser (not sent anywhere yet)

4. **Confirm Your Choice**
   - Click "🔐 CONFIRM" to encrypt and submit
   - Your choice is encrypted in-browser using FHE
   - The encrypted value is sent to the smart contract
   - **Important**: The contract never sees your plaintext choice!

5. **Wait for Processing**
   - The contract generates an encrypted random treasure position
   - It compares your encrypted choice with the encrypted position
   - All of this happens without decrypting anything!

6. **Reveal Your Result**
   - After the transaction confirms, your result is automatically decrypted
   - 💎 **WIN**: You found the treasure! (Your choice matched the random position)
   - 💨 **TRY AGAIN**: Close, but not quite! (Your choice didn't match)

7. **Play Again**
   - Click "🔄 PLAY AGAIN" to reset and try your luck again
   - Or use the contract's `resetGame()` function to clear your state

## 📜 Smart Contract

### Deployment Details

| Network | Address | Explorer | Status |
|---------|---------|-----------|--------|
| Sepolia | `0x79CF4fD6bA7f175f50EbE29F1f773c045b059D05` | [View on Etherscan ↗](https://sepolia.etherscan.io/address/0x79CF4fD6bA7f175f50EbE29F1f773c045b059D05#code) | ✅ Deployed |

### Contract Functions

- **`play(externalEuint8 encryptedChoice, bytes inputProof)`**: Submit your encrypted choice and play the game
- **`getResult(address player)`**: Get your encrypted result handle for decryption
- **`hasPlayed(address player)`**: Check if a player has already played
- **`resetGame()`**: Reset your game state to play again

### FHE Operations

The contract performs all game logic on encrypted data:

```solidity
// Generate encrypted random treasure position (1-4)
euint8 rand = FHE.randEuint8();
euint8 treasurePosition = FHE.add(FHE.and(rand, FHE.asEuint8(3)), FHE.asEuint8(1));

// Compare encrypted user choice with encrypted treasure position
ebool isMatch = FHE.eq(userChoice, treasurePosition);

// Select encrypted result (1 = win, 0 = lose)
euint8 result = FHE.select(isMatch, FHE.asEuint8(1), FHE.asEuint8(0));
```

All operations happen in encrypted form, so the contract never sees plaintext values!

## 🔒 Privacy & Security

### How FHE Protects Your Privacy

1. **Your Choice is Private**: When you select a treasure chest, that choice is encrypted in your browser before being sent to the blockchain. The smart contract receives only an encrypted handle, so it never knows which chest you picked.

2. **Random Position is Encrypted**: The treasure position is generated using `FHE.randEuint8()`, creating a truly random encrypted value. Even the contract can't decrypt it until you authorize decryption.

3. **Comparison is Encrypted**: The contract uses `FHE.eq()` to compare your encrypted choice with the encrypted treasure position. This comparison happens entirely in encrypted form.

4. **Result is Encrypted**: The win/lose result (1 or 0) is stored as an encrypted `euint8`. Only you can decrypt it using your wallet signature.

5. **Access Control**: The contract uses `FHE.allow(result, msg.sender)` to ensure only you can decrypt your own result. Other players cannot see your outcome.

### Security Audit

A comprehensive FHE audit has been performed. See [`FHE_AUDIT_REPORT.md`](./FHE_AUDIT_REPORT.md) for details.

**Key Findings**:
- ✅ All sensitive data is encrypted end-to-end
- ✅ No plaintext values are stored on-chain
- ✅ Decryption requires EIP-712 signature verification
- ✅ No security vulnerabilities identified

## 🧪 Testing

The project includes comprehensive test coverage:

```bash
cd contracts
npm test
```

**Test Coverage**:
- ✅ 21 unit tests (all passing)
- ✅ Deployment and initialization tests
- ✅ State management tests
- ✅ Access control tests
- ✅ Event emission tests
- ✅ Edge case handling

For FHE integration testing on Sepolia, see [`contracts/test/INTEGRATION_TEST_GUIDE.md`](./contracts/test/INTEGRATION_TEST_GUIDE.md).

## 📚 How It Works (Technical Deep Dive)

### Encryption Flow

1. **Browser Encryption** (`frontend/src/lib/fhe.ts`):
   ```typescript
   const input = fhevm.createEncryptedInput(contractAddress, userAddress);
   input.add8(BigInt(choice)); // choice = 1-4
   const encrypted = await input.encrypt();
   // Returns: { handle, inputProof }
   ```

2. **On-Chain Processing** (`contracts/contracts/UniqueTreasure.sol`):
   ```solidity
   // Convert external encrypted input
   euint8 userChoice = FHE.fromExternal(encryptedChoice, inputProof);
   
   // Generate encrypted random position
   euint8 treasurePosition = FHE.add(
       FHE.and(FHE.randEuint8(), FHE.asEuint8(3)), 
       FHE.asEuint8(1)
   );
   
   // Encrypted comparison
   ebool isMatch = FHE.eq(userChoice, treasurePosition);
   euint8 result = FHE.select(isMatch, FHE.asEuint8(1), FHE.asEuint8(0));
   
   // Authorize user to decrypt
   FHE.allow(result, msg.sender);
   ```

3. **Browser Decryption** (`frontend/src/lib/fhe.ts`):
   ```typescript
   // Get encrypted result handle from contract
   const handle = await contract.getResult(userAddress);
   
   // Generate EIP-712 signature for reencryption
   const signature = await signer.signTypedData(eip712);
   
   // Decrypt using SDK
   const decrypted = await fhevm.userDecrypt(handle, ...);
   // Returns: 0n (lose) or 1n (win)
   ```

### Why This Matters

Traditional blockchain games require revealing your choice before the game resolves, which can be exploited. With FHE:

- **Fairness**: The random position is generated after your choice is encrypted
- **Privacy**: Your choice remains secret even from the contract
- **Trustlessness**: No need to trust a centralized server or oracle
- **Transparency**: All code is on-chain and verifiable

## 🎯 Use Cases & Extensions

This project demonstrates FHE's potential for:

- **Privacy-Preserving Gaming**: Fair random games without revealing choices
- **Encrypted Lotteries**: Transparent lotteries with private participant data
- **DAO Voting**: Private voting with public verification
- **Encrypted Auctions**: Sealed-bid auctions on-chain
- **Fair Random Selection**: Transparent random selection with encrypted inputs

### Possible Extensions

- Multi-player games with encrypted leaderboards
- NFT-based treasure rewards
- Time-locked treasure reveals
- Progressive jackpot mechanics
- Cross-chain FHE operations

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Guidelines

- Follow existing code style and patterns
- Add tests for new features
- Update documentation as needed
- Ensure FHE operations remain encrypted end-to-end

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

### Core Technologies

- **[Zama](https://www.zama.ai/)** — For building the revolutionary FHEVM protocol that makes fully homomorphic encryption on Ethereum possible. This project would not exist without their groundbreaking work on privacy-preserving blockchain computation.

- **[FHEVM](https://docs.zama.org/protocol)** — The fully homomorphic encryption virtual machine that enables encrypted computation on Ethereum. Special thanks to the Zama team for their comprehensive documentation and developer tools.

### Libraries & Frameworks

- **[@zama-fhe/relayer-sdk](https://www.npmjs.com/package/@zama-fhe/relayer-sdk)** — Official Zama SDK for browser-side FHE operations. The seamless encryption/decryption experience is powered by this excellent library.

- **[Next.js](https://nextjs.org/)** — The React framework that makes building modern web applications a joy. The App Router and server components provide an excellent developer experience.

- **[wagmi](https://wagmi.sh/)** & **[RainbowKit](https://www.rainbowkit.com/)** — Best-in-class Web3 React hooks and wallet connection UI. These tools make wallet integration seamless and user-friendly.

- **[Hardhat](https://hardhat.org/)** — The Ethereum development environment that makes smart contract development, testing, and deployment straightforward.

- **[Framer Motion](https://www.framer.com/motion/)** — Beautiful animations that bring the UI to life and make the user experience delightful.

- **[Tailwind CSS](https://tailwindcss.com/)** — Utility-first CSS framework that enables rapid UI development with a consistent design system.

### Inspiration

This project was inspired by the need to demonstrate practical applications of fully homomorphic encryption on blockchain. The goal is to show that privacy and transparency can coexist through cryptographic innovation.

### Special Thanks

- The Zama Developer Program for providing resources and support
- The open-source community for building the tools that make projects like this possible
- Early testers and contributors who provided valuable feedback

---

**Built with ❤️ using Zama FHEVM**

*Privacy is not a feature, it's a fundamental right. FHE makes it possible on-chain.*

