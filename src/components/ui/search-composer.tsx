"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchComposerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchComposer({ value, onChange, placeholder, className }: SearchComposerProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={cn("relative", className)}>
      {/* Ambient glow */}
      <motion.div
        className="absolute -inset-px rounded-[20px] pointer-events-none"
        animate={{ opacity: isFocused ? 1 : 0, scale: isFocused ? 1 : 0.99 }}
        transition={{ duration: 0.35 }}
        style={{
          background: "radial-gradient(ellipse at 50% 100%, rgba(139, 92, 246, 0.05) 0%, transparent 70%)",
        }}
      />
      <motion.div
        className="absolute -inset-px rounded-[20px] pointer-events-none"
        animate={{ opacity: isFocused ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        style={{
          background: "linear-gradient(135deg, rgba(139, 92, 246, 0.06) 0%, rgba(139, 92, 246, 0.02) 50%, rgba(139, 92, 246, 0.04) 100%)",
        }}
      />

      {/* Composer box — lifts on focus */}
      <motion.div
        animate={{
          y: isFocused ? -2 : 0,
          borderColor: isFocused ? "rgba(139, 92, 246, 0.4)" : "var(--color-border)",
          boxShadow: isFocused
            ? "0 0 0 1px rgba(139, 92, 246, 0.10), 0 4px 12px -4px rgba(139, 92, 246, 0.08), 0 0 20px -8px rgba(139, 92, 246, 0.05)"
            : "none",
        }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
        className="relative bg-[#0c0c0f] border rounded-2xl overflow-hidden"
      >
        {/* Top glow line */}
        <motion.div
          className="absolute top-0 left-[15%] right-[15%] h-px pointer-events-none"
          animate={{ opacity: isFocused ? 1 : 0, scaleX: isFocused ? 1 : 0.3 }}
          transition={{ duration: 0.4 }}
          style={{ background: "linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.25), transparent)" }}
        />

        <div className="flex items-center gap-3 px-4 py-3.5">
          <Search size={16} className={cn("shrink-0 transition-colors", isFocused ? "text-accent" : "text-muted-foreground")} />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder || "Search..."}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
          />
        </div>
      </motion.div>
    </div>
  );
}
