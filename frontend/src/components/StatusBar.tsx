"use client";

import { useAccount, useDisconnect } from "wagmi";
import { useState } from "react";
import { Copy, Check, ExternalLink, LogOut, Zap, AlertCircle, Loader2 } from "lucide-react";
import { CONTRACT_ADDRESS } from "@/lib/wagmi";

interface StatusBarProps {
  fhevmStatus: "idle" | "initializing" | "ready" | "error";
}

export function StatusBar({ fhevmStatus }: StatusBarProps) {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getFhevmStatusDisplay = () => {
    switch (fhevmStatus) {
      case "ready":
        return (
          <div className="flex items-center gap-2 text-max-secondary">
            <Zap className="h-4 w-4" />
            <span className="font-bold text-sm uppercase tracking-wider">FHE READY</span>
          </div>
        );
      case "initializing":
        return (
          <div className="flex items-center gap-2 text-max-tertiary">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="font-bold text-sm uppercase tracking-wider">LOADING</span>
          </div>
        );
      case "error":
        return (
          <div className="flex items-center gap-2 text-max-quaternary">
            <AlertCircle className="h-4 w-4" />
            <span className="font-bold text-sm uppercase tracking-wider">ERROR</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 text-white/50">
            <Zap className="h-4 w-4" />
            <span className="font-bold text-sm uppercase tracking-wider">IDLE</span>
          </div>
        );
    }
  };

  return (
    <div className="fixed top-0 right-0 left-0 z-50 p-4">
      <div className="flex justify-end">
        <div className="flex items-center gap-3 bg-max-muted/80 backdrop-blur-sm border-4 border-max-accent rounded-full px-6 py-3 shadow-multi">
          {/* FHEVM Status */}
          {getFhevmStatusDisplay()}

          <div className="w-px h-6 bg-max-accent/50" />

          {/* Contract Address */}
          <a
            href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-max-tertiary hover:text-max-secondary transition-colors group"
          >
            <span className="font-bold text-sm">{shortenAddress(CONTRACT_ADDRESS)}</span>
            <ExternalLink className="h-4 w-4 group-hover:scale-110 transition-transform" />
          </a>

          {isConnected && address && (
            <>
              <div className="w-px h-6 bg-max-accent/50" />

              {/* Wallet Address */}
              <button
                onClick={copyAddress}
                className="flex items-center gap-2 text-max-secondary hover:text-max-tertiary transition-colors group"
              >
                <span className="font-bold text-sm">{shortenAddress(address)}</span>
                {copied ? (
                  <Check className="h-4 w-4 text-max-secondary" />
                ) : (
                  <Copy className="h-4 w-4 group-hover:scale-110 transition-transform" />
                )}
              </button>

              <div className="w-px h-6 bg-max-accent/50" />

              {/* Disconnect Button */}
              <button
                onClick={() => disconnect()}
                className="flex items-center gap-2 text-max-quaternary hover:text-max-accent transition-colors group"
              >
                <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

