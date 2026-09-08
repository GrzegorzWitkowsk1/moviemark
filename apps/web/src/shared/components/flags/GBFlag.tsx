interface FlagProps {
  size?: number;
}

export default function GBFlag({ size = 22 }: FlagProps) {
  return (
    <svg
      width={size}
      height={Math.round(size * 0.6)}
      viewBox="0 0 60 36"
      role="img"
      aria-hidden="true"
    >
      <rect width="60" height="36" fill="#012169" />
      <path d="M0 0 L60 36 M60 0 L0 36" stroke="#fff" strokeWidth="12" />
      <path d="M0 0 L60 36 M60 0 L0 36" stroke="#C8102E" strokeWidth="6" />
      <path d="M0 18 H60 M30 0 V36" stroke="#fff" strokeWidth="12" />
      <path d="M0 18 H60 M30 0 V36" stroke="#C8102E" strokeWidth="6" />
    </svg>
  );
}