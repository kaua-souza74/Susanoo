"use client";
import Image from "next/image";
import logoClaro from "@/Assets/claro.png"; // White logo (for dark background)
import logoEscuro from "@/Assets/escuro.png"; // Dark logo (for light background)

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className = "", size = "md" }: LogoProps) {
  // Determine dimensions based on size prop
  let width = 220;
  let height = 60;
  let imgClass = "h-14 w-auto";

  if (size === "sm") {
    width = 150;
    height = 42;
    imgClass = "h-10 w-auto";
  } else if (size === "lg") {
    width = 280;
    height = 78;
    imgClass = "h-[70px] w-auto";
  }

  return (
    <span className={`inline-flex items-center ${className}`}>
      {/* logoEscuro (Dark text logo) -> displayed in LIGHT MODE (dark:hidden) */}
      <Image
        src={logoEscuro}
        alt="Susanoo"
        width={width}
        height={height}
        className={`dark:hidden object-contain ${imgClass}`}
        priority
      />
      {/* logoClaro (White text logo) -> displayed in DARK MODE (hidden dark:block) */}
      <Image
        src={logoClaro}
        alt="Susanoo"
        width={width}
        height={height}
        className={`hidden dark:block object-contain ${imgClass}`}
        priority
      />
    </span>
  );
}
