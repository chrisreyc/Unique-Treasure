"use client";

import { initSDK, createInstance, SepoliaConfig } from "@zama-fhe/relayer-sdk/web";

let instance: any = null;
let isInitialized = false;
let isInitializing = false;
let initError: string | null = null;

// Uint8Array to hex string with 0x prefix
function toHex(arr: Uint8Array): `0x${string}` {
  return `0x${Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")}`;
}

export async function initFhevm(): Promise<any> {
  if (typeof window === "undefined") {
    throw new Error("FHEVM can only be initialized in browser");
  }

  if (instance && isInitialized) return instance;
  if (initError) throw new Error(initError);

  if (isInitializing) {
    return new Promise((resolve, reject) => {
      const check = setInterval(() => {
        if (isInitialized && instance) {
          clearInterval(check);
          resolve(instance);
        }
        if (initError) {
          clearInterval(check);
          reject(new Error(initError));
        }
      }, 100);
    });
  }

  isInitializing = true;

  try {
    // thread: 0 disables multithreading to avoid COOP/COEP header issues
    await initSDK({ thread: 0 });
    instance = await createInstance(SepoliaConfig);
    isInitialized = true;
    return instance;
  } catch (error: any) {
    initError = error.message || "Failed to initialize FHEVM";
    throw error;
  } finally {
    isInitializing = false;
  }
}

export function isFhevmReady(): boolean {
  return isInitialized && instance !== null;
}

export function getFhevmError(): string | null {
  return initError;
}

export function getFhevmStatus(): "idle" | "initializing" | "ready" | "error" {
  if (initError) return "error";
  if (isInitialized && instance) return "ready";
  if (isInitializing) return "initializing";
  return "idle";
}

// Encrypt user choice (1-4)
export async function encryptChoice(
  contractAddress: string,
  userAddress: string,
  choice: number
): Promise<{ handle: `0x${string}`; inputProof: `0x${string}` }> {
  const fhevm = await initFhevm();
  const input = fhevm.createEncryptedInput(contractAddress, userAddress);
  input.add8(BigInt(choice));

  const encrypted = await input.encrypt();
  return {
    handle: toHex(encrypted.handles[0]),
    inputProof: toHex(encrypted.inputProof),
  };
}

// User private decryption using SDK's built-in userDecrypt
export async function userDecrypt(
  handle: string,
  contractAddress: string,
  signer: any
): Promise<bigint> {
  const fhevm = await initFhevm();

  // Get user address
  const userAddress =
    typeof signer.getAddress === "function"
      ? await signer.getAddress()
      : signer.account?.address;

  if (!userAddress) {
    throw new Error("Cannot get user address from signer");
  }

  // 1. Generate reencryption keypair
  const { publicKey, privateKey } = fhevm.generateKeypair();

  // 2. Create EIP-712 signature request
  const eip712 = fhevm.createEIP712(publicKey, [contractAddress]);

  // 3. Get parameters from EIP712 message
  const startTimestamp =
    eip712.message.startTimestamp ?? Math.floor(Date.now() / 1000);
  const durationDays = eip712.message.durationDays ?? 1;

  // Prepare message with BigInt values
  const message = {
    ...eip712.message,
    startTimestamp: BigInt(startTimestamp),
    durationDays: BigInt(durationDays),
  };

  // 4. User signs the reencryption request
  const signature = await signer.signTypedData({
    domain: eip712.domain,
    types: eip712.types,
    primaryType: eip712.primaryType,
    message: message,
  });

  // 5. Convert keys to hex format
  const publicKeyStr =
    publicKey instanceof Uint8Array ? toHex(publicKey) : publicKey;
  const privateKeyStr =
    privateKey instanceof Uint8Array ? toHex(privateKey) : privateKey;

  // 6. Use SDK's built-in userDecrypt
  const handleContractPairs = [{ handle, contractAddress }];

  const results = await fhevm.userDecrypt(
    handleContractPairs,
    privateKeyStr,
    publicKeyStr,
    signature,
    [contractAddress],
    userAddress,
    String(startTimestamp),
    String(durationDays)
  );

  // 7. Extract decrypted value
  const decryptedValue = results[handle];

  if (decryptedValue === undefined) {
    throw new Error("No decrypted value found for handle");
  }

  return BigInt(decryptedValue);
}

