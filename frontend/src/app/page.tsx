"use client";

import { useEffect, useState } from "react";
import { StatusBar } from "@/components/StatusBar";
import { TreasureGame } from "@/components/TreasureGame";
import { initFhevm } from "@/lib/fhe";

export default function Home() {
  const [fhevmStatus, setFhevmStatus] = useState<"idle" | "initializing" | "ready" | "error">("idle");

  useEffect(() => {
    const init = async () => {
      setFhevmStatus("initializing");
      try {
        await initFhevm();
        setFhevmStatus("ready");
      } catch (error) {
        // Log error only in development
        if (process.env.NODE_ENV === "development") {
          console.error("FHEVM init error:", error);
        }
        setFhevmStatus("error");
      }
    };

    init();
  }, []);

  return (
    <main className="min-h-screen bg-max-bg overflow-hidden">
      <StatusBar fhevmStatus={fhevmStatus} />
      <TreasureGame />
    </main>
  );
}

