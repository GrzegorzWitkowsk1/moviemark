import type { CSSProperties, ReactNode } from "react";
import type { ComponentType } from "react";

export type IconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: CSSProperties;
};

export type GenreIcon = ComponentType<IconProps>;

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function SvgIcon({
  size = 24,
  children,
}: {
  size?: number;
  children: ReactNode;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...stroke}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function FaceGrinning({ size = 24 }: IconProps) {
  return (
    <SvgIcon size={size}>
      <circle cx="12" cy="12" r="10" />
      <path d="M8 9.5c.7 2 7.3 2 8 0" />
      <path d="M7.5 14.5c1.6 2.2 7.4 2.2 9 0" />
      <path d="M10 17h4" />
    </SvgIcon>
  );
}

export function UserGroup({ size = 24 }: IconProps) {
  return (
    <SvgIcon size={size}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c.5-3 2.5-4.5 5.5-4.5s5 1.5 5.5 4.5" />
      <circle cx="17.5" cy="8" r="2.25" />
      <path d="M16.5 14.4c2.6.2 4 1.6 4.5 4.1" />
    </SvgIcon>
  );
}

export function Knife({ size = 24 }: IconProps) {
  return (
    <SvgIcon size={size}>
      <path d="M12 2l6 9-6 7-6-7z" />
      <path d="M12 18v4" />
      <path d="M6.5 11h11" />
    </SvgIcon>
  );
}

export function Shocked({ size = 24 }: IconProps) {
  return (
    <SvgIcon size={size}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="9" cy="9.5" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="15" cy="9.5" r="1.4" fill="currentColor" stroke="none" />
      <ellipse cx="12" cy="15.5" rx="2.6" ry="3.1" />
    </SvgIcon>
  );
}

export function Horse({ size = 24 }: IconProps) {
  return (
    <SvgIcon size={size}>
      <ellipse cx="10" cy="11" rx="4.2" ry="6.2" />
      <path d="M13.5 6.5c2.2.4 3.8 2 4.3 4.2.3 1.4-.4 2.6-1.9 3.1" />
      <path d="M8 4.5l1.2 3M12 4l1 3.2" />
      <path d="M6.5 16c-1.8 1-2.4 2.6-1.8 3.6M13.6 16.6c1.6-2.4.6-3.6 1.8-5.2" />
    </SvgIcon>
  );
}

export function QuestionIcon({ size = 24 }: IconProps) {
  return (
    <SvgIcon size={size}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.2 9.2a2.8 2.8 0 0 1 5.3 1.3c0 1.8-2.5 2.2-2.5 3.8" />
      <circle cx="12" cy="17.3" r="0.4" fill="currentColor" stroke="none" />
    </SvgIcon>
  );
}