interface FlagProps {
  size?: number;
}

export default function PLFlag({ size = 22 }: FlagProps) {
  return (
    <svg
      width={size}
      height={Math.round(size * 0.6)}
      viewBox="0 0 60 36"
      role="img"
      aria-hidden="true"
    >
      <rect width="60" height="36" fill="#fff" />
      <rect y="18" width="60" height="18" fill="#DC143C" />
    </svg>
  );
}