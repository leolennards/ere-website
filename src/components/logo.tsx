import Image from "next/image";
import logoRed from "../../public/brand/ere-logo.png";
import logoWhite from "../../public/brand/ere-logo-white.png";

/** The original ERE logo, unaltered apart from trimming (white version for dark backgrounds). */
export function Logo({ variant = "red", className, priority }: { variant?: "red" | "white"; className?: string; priority?: boolean }) {
  return (
    <Image
      src={variant === "white" ? logoWhite : logoRed}
      alt="ERE — Elevate Real Estate"
      className={className}
      priority={priority}
      sizes="160px"
    />
  );
}
