/** Shared Archon diamond logo mark — single source of truth. */
export default function ArchonMark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <polygon points="14,2 24,10 14,18 4,10" fill="#5B00E8" />
      <polygon points="14,2 4,10 14,10"        fill="#1A0050" />
      <polygon points="14,2 24,10 14,10"       fill="#8B3DFF" />
      <polygon points="4,10 14,18 14,10"       fill="#2D0070" />
      <polygon points="24,10 14,18 14,10"      fill="#C4A0FF" />
      <circle cx="14" cy="10" r="2.5" fill="#EDE5FF" opacity="0.7" />
    </svg>
  );
}
