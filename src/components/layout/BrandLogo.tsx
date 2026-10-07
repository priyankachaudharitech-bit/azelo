import { cn } from "@/lib/cn";
import Image from "next/image";

type BrandLogoProps = {
  variant?: "horizontal" | "mark";
  theme?: "dark" | "light";
  monochrome?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

const SIZES = {
  sm: { mark: 28, horizontalWidth: 120, horizontalHeight: 36 },
  md: { mark: 34, horizontalWidth: 150, horizontalHeight: 42 },
  lg: { mark: 38, horizontalWidth: 180, horizontalHeight: 48 },
  xl: { mark: 44, horizontalWidth: 220, horizontalHeight: 56 },
} as const;

export function BrandLogo({
  variant = "horizontal",
  theme: _theme,
  monochrome: _monochrome,
  size = "md",
  className,
}: BrandLogoProps) {
  const { mark: markSize, horizontalWidth, horizontalHeight } = SIZES[size];
  const isHorizontal = variant === "horizontal";
  const containerSize = isHorizontal ? horizontalWidth : markSize;
  const containerHeight = isHorizontal ? horizontalHeight : markSize;

  return (
    <span aria-label="AZELO" className={cn("inline-flex shrink-0", className)}>
      <span
        className="block relative"
        style={{ width: `${containerSize}px`, height: `${containerHeight}px` }}
      >
        {variant === "mark" ? (
          <Mark />
        ) : (
          <Image
            src="/azelo-logo.png"
            alt=""
            aria-hidden="true"
            width={containerSize}
            height={containerHeight}
            className="block h-full w-full"
            style={{ objectFit: "contain" }}
          />
        )}
      </span>
    </span>
  );
}

function Mark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 100"
      className="block h-full w-full"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M8 84 L40 19 Q42 14 47 14 L53 14 L31 84 Z" fill="#F5F7FA" />
      <path d="M51 14 Q57 14 60 20 L92 84 L70 84 L48 34 Z" fill="#F5F7FA" />
      <path d="M35 69 L62 69 L67 79 L30 79 Z" fill="#22D3EE" />
    </svg>
  );
}
