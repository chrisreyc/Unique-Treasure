"use client";

import { motion } from "framer-motion";

interface TreasureChestProps {
  index: number;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
  revealed?: boolean;
  isWinner?: boolean;
}

const CHEST_COLORS = [
  { border: "#FF3AF2", glow: "rgba(255, 58, 242, 0.5)", bg: "#FF3AF2" },
  { border: "#00F5D4", glow: "rgba(0, 245, 212, 0.5)", bg: "#00F5D4" },
  { border: "#FFE600", glow: "rgba(255, 230, 0, 0.5)", bg: "#FFE600" },
  { border: "#7B2FFF", glow: "rgba(123, 47, 255, 0.5)", bg: "#7B2FFF" },
];

export function TreasureChest({
  index,
  selected,
  disabled,
  onClick,
  revealed,
  isWinner,
}: TreasureChestProps) {
  const color = CHEST_COLORS[index];

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative w-32 h-32 md:w-40 md:h-40 rounded-3xl border-4
        transition-all duration-300 font-display text-6xl md:text-7xl
        ${disabled && !selected ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
        ${selected ? "scale-110" : "hover:scale-105"}
      `}
      style={{
        borderColor: color.border,
        backgroundColor: selected ? `${color.bg}20` : "rgba(45, 27, 78, 0.6)",
        boxShadow: selected
          ? `0 0 30px ${color.glow}, 0 0 60px ${color.glow}, 8px 8px 0 ${color.border}`
          : `8px 8px 0 ${color.border}`,
      }}
      whileHover={!disabled ? { rotate: [-2, 2, -2, 0] } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      {/* Chest Icon */}
      <span className="relative z-10">
        {revealed ? (isWinner ? "💎" : "💨") : "📦"}
      </span>

      {/* Selection indicator */}
      {selected && !revealed && (
        <motion.div
          className="absolute inset-0 rounded-3xl border-4 border-dashed"
          style={{ borderColor: color.border }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Sparkle effect when selected */}
      {selected && (
        <>
          <motion.span
            className="absolute -top-2 -right-2 text-2xl"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            ✨
          </motion.span>
          <motion.span
            className="absolute -bottom-2 -left-2 text-2xl"
            animate={{ rotate: -360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            ⚡
          </motion.span>
        </>
      )}

      {/* Chest number */}
      <div
        className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full font-bold text-sm"
        style={{
          backgroundColor: color.border,
          color: "#0D0D1A",
        }}
      >
        #{index + 1}
      </div>
    </motion.button>
  );
}

