/**
 * ArchonMark — the brand octahedron logo as an inline SVG.
 *
 * Shared by Home, Login, and SidebarLayout so the mark renders identically
 * across marketing, auth, and authenticated surfaces. Pure SVG — no asset
 * pipeline, scales crisply at any size, and travels with the bundle.
 */

interface ArchonMarkProps {
  /** Pixel size of the rendered square (width = height). Defaults to 24. */
  size?: number;
  /** Optional className passthrough for layout helpers. */
  className?: string;
}

export default function ArchonMark({ size = 24, className }: ArchonMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <polygon points="14,2 24,10 14,18 4,10" fill="#5B00E8" />
      <polygon points="14,2 4,10 14,10" fill="#1A0050" />
      <polygon points="14,2 24,10 14,10" fill="#8B3DFF" />
      <polygon points="4,10 14,18 14,10" fill="#2D0070" />
      <polygon points="24,10 14,18 14,10" fill="#C4A0FF" />
      <circle cx="14" cy="10" r="2.5" fill="#EDE5FF" opacity="0.7" />
    </svg>
  );
}
