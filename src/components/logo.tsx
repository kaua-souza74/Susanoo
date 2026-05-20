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
  let width = 280;
  let height = 80;
  let imgClass = "h-20 w-auto md:h-24";

  if (size === "sm") {
    width = 180;
    height = 50;
    imgClass = "h-12 w-auto";
  } else if (size === "lg") {
    width = 350;
    height = 100;
    imgClass = "h-28 w-auto md:h-32";
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
