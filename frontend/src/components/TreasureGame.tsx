"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useWalletClient } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles, Trophy, X } from "lucide-react";
import { TreasureChest } from "./TreasureChest";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/wagmi";
import { encryptChoice, userDecrypt, isFhevmReady } from "@/lib/fhe";

type GameStep = "idle" | "selecting" | "encrypting" | "submitting" | "waiting" | "decrypting" | "result";

export function TreasureGame() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  
  const [step, setStep] = useState<GameStep>("idle");
  const [selectedChest, setSelectedChest] = useState<number | null>(null);
  const [result, setResult] = useState<"win" | "lose" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { writeContract, data: txHash, isPending: isWritePending, error: writeError } = useWriteContract();
  const { isLoading: isTxLoading, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  // Read game result handle
  const { data: resultHandle, refetch: refetchResult } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getResult",
    args: address ? [address] : undefined,
    query: { enabled: false },
  });

  // Reset on disconnect or address change
  useEffect(() => {
    resetGame();
  }, [address, isConnected]);

  const resetGame = () => {
    setStep("idle");
    setSelectedChest(null);
    setResult(null);
    setError(null);
  };

  const handleChestSelect = (index: number) => {
    if (step === "selecting") {
      setSelectedChest(index);
    }
  };

  const startGame = () => {
    if (!isFhevmReady()) {
      setError("FHE not ready");
      return;
    }
    setStep("selecting");
    setSelectedChest(null);
    setResult(null);
    setError(null);
  };

  const submitChoice = async () => {
    if (selectedChest === null || !address) return;

    try {
      setStep("encrypting");
      
      // Encrypt choice (1-4)
      const { handle, inputProof } = await encryptChoice(
        CONTRACT_ADDRESS,
        address,
        selectedChest + 1
      );

      setStep("submitting");
      
      // Submit to contract
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "play",
        args: [handle, inputProof],
        gas: BigInt(500000),
      });
    } catch (err: any) {
      setError(err.message || "Encryption failed");
      setStep("selecting");
    }
  };

  // Handle transaction confirmation
  useEffect(() => {
    if (isTxSuccess && step === "submitting") {
      setStep("waiting");
      // Wait a bit for contract state to update, then decrypt
      setTimeout(async () => {
        await decryptResult();
      }, 2000);
    }
  }, [isTxSuccess]);

  // Handle write error
  useEffect(() => {
    if (writeError) {
      setError(writeError.message || "Transaction failed");
      setStep("selecting");
    }
  }, [writeError]);

  const decryptResult = async () => {
    if (!walletClient || !address) return;

    try {
      setStep("decrypting");
      
      // Refetch result handle
      const { data: handle } = await refetchResult();
      
      if (!handle || handle === BigInt(0)) {
        throw new Error("No result found");
      }

      // Convert handle to hex string
      const handleHex = `0x${handle.toString(16).padStart(64, '0')}`;

      // Decrypt using SDK's userDecrypt
      const decrypted = await userDecrypt(handleHex, CONTRACT_ADDRESS, walletClient);

      // Result: 1 = win, 0 = lose
      setResult(decrypted === BigInt(1) ? "win" : "lose");
      setStep("result");
    } catch (err: any) {
      setError(err.message || "Decryption failed");
      setStep("selecting");
    }
  };

  const getStepMessage = () => {
    switch (step) {
      case "idle":
        return "READY TO PLAY?";
      case "selecting":
        return selectedChest !== null ? "CONFIRM YOUR CHOICE" : "PICK A TREASURE";
      case "encrypting":
        return "ENCRYPTING...";
      case "submitting":
        return "SUBMITTING TX...";
      case "waiting":
        return "PROCESSING...";
      case "decrypting":
        return "DECRYPTING...";
      case "result":
        return result === "win" ? "YOU WIN! 🎉" : "TRY AGAIN! 💪";
      default:
        return "";
    }
  };

  const isLoading = step === "encrypting" || step === "submitting" || step === "waiting" || step === "decrypting" || isWritePending || isTxLoading;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-20">
      {/* Background decorations */}
      <div className="fixed inset-0 pattern-dots opacity-20 pointer-events-none" />
      <div className="fixed inset-0 pattern-mesh pointer-events-none" />
      
      {/* Floating emojis */}
      <motion.span
        className="fixed top-[15%] left-[10%] text-6xl"
        animate={{ y: [-10, 10, -10], rotate: [-5, 5, -5] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        💎
      </motion.span>
      <motion.span
        className="fixed top-[25%] right-[15%] text-5xl"
        animate={{ y: [10, -10, 10], rotate: [5, -5, 5] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        ✨
      </motion.span>
      <motion.span
        className="fixed bottom-[20%] left-[8%] text-5xl"
        animate={{ y: [-15, 15, -15] }}
        transition={{ duration: 5, repeat: Infinity }}
      >
        🎰
      </motion.span>
      <motion.span
        className="fixed bottom-[30%] right-[10%] text-6xl"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        🌟
      </motion.span>

      {/* Title */}
      <motion.h1
        className="font-display text-6xl md:text-8xl text-center mb-8 text-shadow-mega gradient-text animate-gradient-shift"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        UNIQUE TREASURE
      </motion.h1>

      {/* Main game area */}
      <div className="relative z-10 w-full max-w-4xl">
        {!isConnected ? (
          /* Connect wallet state */
          <motion.div
            className="flex flex-col items-center gap-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="text-2xl font-bold text-max-tertiary uppercase tracking-wider text-shadow-single">
              CONNECT TO PLAY
            </div>
            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <motion.button
                  onClick={openConnectModal}
                  className="px-12 py-5 rounded-full font-display text-2xl uppercase tracking-widest
                    bg-gradient-to-r from-max-accent via-max-quinary to-max-secondary
                    border-4 border-max-tertiary glow-accent-lg
                    hover:scale-110 active:scale-95 transition-transform"
                  whileHover={{ rotate: [-1, 1, -1, 0] }}
                  whileTap={{ scale: 0.95 }}
                >
                  🔗 CONNECT
                </motion.button>
              )}
            </ConnectButton.Custom>
          </motion.div>
        ) : (
          /* Game content */
          <motion.div
            className="flex flex-col items-center gap-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Status message */}
            <motion.div
              key={step}
              className="text-3xl md:text-4xl font-bold uppercase tracking-wider text-center"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              style={{
                color: result === "win" ? "#00F5D4" : result === "lose" ? "#FF6B35" : "#FFE600",
                textShadow: "2px 2px 0px #7B2FFF, 4px 4px 0px #FF3AF2",
              }}
            >
              {getStepMessage()}
            </motion.div>

            {/* Error display */}
            <AnimatePresence>
              {error && (
                <motion.div
                  className="flex items-center gap-2 px-6 py-3 bg-max-quaternary/20 border-4 border-max-quaternary rounded-full"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <X className="h-5 w-5 text-max-quaternary" />
                  <span className="font-bold text-max-quaternary">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Loading indicator */}
            {isLoading && (
              <motion.div
                className="flex items-center gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Loader2 className="h-8 w-8 text-max-accent animate-spin" />
                <div className="w-48 h-3 bg-max-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-max-accent via-max-secondary to-max-tertiary"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </div>
              </motion.div>
            )}

            {/* Treasure chests */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mt-4">
              {[0, 1, 2, 3].map((index) => (
                <TreasureChest
                  key={index}
                  index={index}
                  selected={selectedChest === index}
                  disabled={step !== "selecting"}
                  onClick={() => handleChestSelect(index)}
                  revealed={step === "result"}
                  isWinner={step === "result" && result === "win" && selectedChest === index}
                />
              ))}
            </div>

            {/* Result display */}
            <AnimatePresence>
              {step === "result" && (
                <motion.div
                  className={`flex items-center gap-4 px-8 py-4 rounded-3xl border-4 ${
                    result === "win"
                      ? "bg-max-secondary/20 border-max-secondary"
                      : "bg-max-quaternary/20 border-max-quaternary"
                  }`}
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                >
                  {result === "win" ? (
                    <Trophy className="h-12 w-12 text-max-secondary" />
                  ) : (
                    <Sparkles className="h-12 w-12 text-max-quaternary" />
                  )}
                  <span className="font-display text-4xl">
                    {result === "win" ? "JACKPOT!" : "SO CLOSE!"}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action buttons */}
            <div className="flex gap-4 mt-4">
              {step === "idle" && (
                <motion.button
                  onClick={startGame}
                  className="px-10 py-4 rounded-full font-display text-xl uppercase tracking-widest
                    bg-gradient-to-r from-max-accent via-max-quinary to-max-secondary
                    border-4 border-max-tertiary shadow-multi
                    hover:scale-105 active:scale-95 transition-transform"
                  whileHover={{ rotate: [-1, 1, 0] }}
                  whileTap={{ scale: 0.95 }}
                >
                  🎮 START
                </motion.button>
              )}

              {step === "selecting" && selectedChest !== null && (
                <motion.button
                  onClick={submitChoice}
                  className="px-10 py-4 rounded-full font-display text-xl uppercase tracking-widest
                    bg-gradient-to-r from-max-secondary via-max-tertiary to-max-quaternary
                    border-4 border-max-accent shadow-multi
                    hover:scale-105 active:scale-95 transition-transform"
                  whileHover={{ rotate: [-1, 1, 0] }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  🔐 CONFIRM
                </motion.button>
              )}

              {step === "result" && (
                <motion.button
                  onClick={resetGame}
                  className="px-10 py-4 rounded-full font-display text-xl uppercase tracking-widest
                    bg-gradient-to-r from-max-tertiary via-max-quaternary to-max-accent
                    border-4 border-max-secondary shadow-multi
                    hover:scale-105 active:scale-95 transition-transform"
                  whileHover={{ rotate: [-1, 1, 0] }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  🔄 PLAY AGAIN
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Background text */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <span className="font-display text-[15rem] md:text-[25rem] text-max-accent/5 uppercase whitespace-nowrap">
          TREASURE
        </span>
      </div>
    </div>
  );
}

