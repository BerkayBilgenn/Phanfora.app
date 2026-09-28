import type { SVGProps } from "react";

type IconName =
  | "home"
  | "market"
  | "radar"
  | "file"
  | "pie"
  | "star"
  | "bell"
  | "settings"
  | "search"
  | "plus"
  | "chevron"
  | "expand"
  | "trend"
  | "pen"
  | "drop"
  | "pulse"
  | "shield"
  | "arrow"
  | "close"
  | "info"
  | "menu";

const paths: Record<IconName, React.ReactNode> = {
  home: <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" />,
  market: <path d="M4 20v-5m4 5V9m4 11V4m4 16v-8m4 8V6" />,
  radar: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v5m0 12v5M1 12h5m12 0h5" />
    </>
  ),
  file: (
    <>
      <path d="M6 2h8l5 5v14H6z" />
      <path d="M14 2v5h5M9 11h7M9 15h7M9 19h5" />
    </>
  ),
  pie: (
    <>
      <path d="M12 2v10h10A10 10 0 1 1 12 2Z" />
      <path d="M15 2v7h7A10 10 0 0 0 15 2Z" />
    </>
  ),
  star: (
    <path d="m12 2 3.1 6.4 7 .9-5.1 5 .9 7-5.9-3.3-5.9 3.3.9-7-5.1-5 7-.9z" />
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" />
    </>
  ),
  settings: (
    <>
      <path d="M10 2h4l.6 2.2 2.1 1.2 2.2-.6 2 3.4-1.6 1.6v2.4l1.6 1.6-2 3.4-2.2-.6-2.1 1.2L14 22h-4l-.6-2.2-2.1-1.2-2.2.6-2-3.4 1.6-1.6v-2.4L3 10.2l2-3.4 2.2.6 2.1-1.2z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  search: (
    <>
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 5 5" />
    </>
  ),
  plus: <path d="M12 4v16M4 12h16" />,
  chevron: <path d="m6 9 6 6 6-6" />,
  expand: <path d="M9 3H3v6m12-6h6v6M3 15v6h6m12-6v6h-6" />,
  trend: <path d="m2 18 6-7 4 3 8-10m-6 0h6v6" />,
  pen: <path d="m3 21 5-.8L20 8a2.3 2.3 0 0 0-4-4L4 16zM14 6l4 4" />,
  drop: <path d="M12 2c3 5 7 9 7 13a7 7 0 0 1-14 0c0-4 4-8 7-13Z" />,
  pulse: <path d="M2 12h4l3-6 4 12 3-6h6" />,
  shield: <path d="M12 2 4 5v7c0 5 3 8 8 10 5-2 8-5 8-10V5z" />,
  arrow: <path d="M4 12h15m-6-6 6 6-6 6" />,
  close: <path d="M5 5 19 19M19 5 5 19" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6m0-10h.01" />
    </>
  ),
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
};

export function Icon({
  name,
  size = 20,
  ...props
}: SVGProps<SVGSVGElement> & { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
