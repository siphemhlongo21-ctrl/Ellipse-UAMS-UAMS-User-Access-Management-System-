
import ethekwiniLogo from "@/imports/ethekwini-municipality-logo-png_seeklogo-192138.png";
import { ImageWithFallback } from "../components/controls/ImageWithFallback";

// ─── eThekwini Municipality Logo ─────────────────────────────────────────────

export function DomeLogo({ size = 44 }: { size?: number }) {
  return (
    <ImageWithFallback
      src={ethekwiniLogo}
      alt="eThekwini Municipality"
      style={{ width: size, height: size }}
      className="object-contain shrink-0 rounded-md"
    />
  );
}