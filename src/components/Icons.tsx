import type { IconName } from '../types';

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  'aria-hidden'?: boolean;
  strokeWidth?: number;
}

const paths: Record<IconName, React.ReactNode> = {
  spark: (
    <>
      <path d="M12 3.2c.5 4.2 2.6 6.3 6.8 6.8-4.2.5-6.3 2.6-6.8 6.8-.5-4.2-2.6-6.3-6.8-6.8 4.2-.5 6.3-2.6 6.8-6.8Z" />
      <path d="M18.3 15.7c.2 1.7 1.1 2.6 2.8 2.8-1.7.2-2.6 1.1-2.8 2.8-.2-1.7-1.1-2.6-2.8-2.8 1.7-.2 2.6-1.1 2.8-2.8Z" />
    </>
  ),
  sparkSmall: (
    <path d="M12 3.5c.6 4.7 2.8 6.9 7.5 7.5-4.7.6-6.9 2.8-7.5 7.5-.6-4.7-2.8-6.9-7.5-7.5 4.7-.6 6.9-2.8 7.5-7.5Z" />
  ),
  server: (
    <>
      <rect x="3.5" y="4" width="17" height="7" rx="2.2" />
      <rect x="3.5" y="13" width="17" height="7" rx="2.2" />
      <path d="M7 7.5h.01M7 16.5h.01M11 7.5h4M11 16.5h4" />
    </>
  ),
  terminal: (
    <>
      <rect x="3" y="4.2" width="18" height="15.6" rx="3" />
      <path d="m7 9 3 3-3 3M12.5 15H17" />
    </>
  ),
  nodes: (
    <>
      <circle cx="6" cy="6" r="2.2" />
      <circle cx="18" cy="7" r="2.2" />
      <circle cx="12" cy="18" r="2.2" />
      <path d="m7.9 7.1 8.3-.1M7.2 8.1l3.7 7.9M16.8 9l-3.6 7" />
    </>
  ),
  cpu: (
    <>
      <rect x="6.2" y="6.2" width="11.6" height="11.6" rx="2.3" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
      <path d="M9 2.8v3.4M15 2.8v3.4M9 17.8v3.4M15 17.8v3.4M2.8 9h3.4M2.8 15h3.4M17.8 9h3.4M17.8 15h3.4" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3.2 8.5 4.6L12 12.4 3.5 7.8 12 3.2Z" />
      <path d="m4.3 12 7.7 4.2 7.7-4.2M4.3 16.2l7.7 4.2 7.7-4.2" />
    </>
  ),
  network: (
    <>
      <circle cx="12" cy="5" r="2.1" />
      <circle cx="5" cy="18" r="2.1" />
      <circle cx="19" cy="18" r="2.1" />
      <path d="M10.8 7 6 16M13.2 7l4.8 9M7.1 18h9.8" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="5.6" rx="7.4" ry="2.8" />
      <path d="M4.6 5.6v12.8c0 1.5 3.3 2.8 7.4 2.8s7.4-1.3 7.4-2.8V5.6M4.6 12c0 1.5 3.3 2.8 7.4 2.8s7.4-1.3 7.4-2.8" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="8.8" />
      <path d="m14.7 9.3-1.6 3.8-3.8 1.6 1.6-3.8 3.8-1.6Z" />
    </>
  ),
  code: <path d="m8.6 6.5-5.3 5.5 5.3 5.5M15.4 6.5l5.3 5.5-5.3 5.5" />,
  brackets: (
    <path d="M9 3.8H7.6A2.6 2.6 0 0 0 5 6.4v3.1c0 1.4-.7 2.5-2 2.5 1.3 0 2 1.1 2 2.5v3.1a2.6 2.6 0 0 0 2.6 2.6H9M15 3.8h1.4A2.6 2.6 0 0 1 19 6.4v3.1c0 1.4.7 2.5 2 2.5-1.3 0-2 1.1-2 2.5v3.1a2.6 2.6 0 0 1-2.6 2.6H15" />
  ),
  shield: (
    <>
      <path d="M12 2.8 19.5 6v5.4c0 4.5-3 8.1-7.5 9.8-4.5-1.7-7.5-5.3-7.5-9.8V6L12 2.8Z" />
      <path d="m8.8 12 2.2 2.2 4.2-4.4" />
    </>
  ),
  lock: (
    <>
      <rect x="4.7" y="10" width="14.6" height="10.5" rx="3" />
      <path d="M8 10V7.6a4 4 0 0 1 8 0V10M12 14.2v2.2" />
    </>
  ),
  cloud: (
    <path d="M7.1 18.5h10.2a3.9 3.9 0 0 0 .4-7.8 5.6 5.6 0 0 0-10.8-1.3 4.6 4.6 0 0 0 .2 9.1Z" />
  ),
  wrench: (
    <path d="M14.7 6.3a4.4 4.4 0 0 0-5.6 5.6L4.4 16.6a2.1 2.1 0 0 0 3 3l4.7-4.7a4.4 4.4 0 0 0 5.6-5.6l-2.8 2.8-2.6-.6-.6-2.6 3-2.6Z" />
  ),
  gauge: (
    <>
      <path d="M4.2 17.5a9 9 0 1 1 15.6 0" />
      <path d="m12 13.8 3.6-3.5M12 17.4h.01" />
    </>
  ),
  browser: (
    <>
      <rect x="2.8" y="4" width="18.4" height="16" rx="3" />
      <path d="M2.8 8.8h18.4M6.2 6.4h.01M9 6.4h.01" />
    </>
  ),
  plug: (
    <>
      <path d="M9 3.5v5M15 3.5v5M6.5 8.5h11v2.2a5.5 5.5 0 0 1-11 0V8.5ZM12 16.2v4.3" />
    </>
  ),
  pipeline: (
    <>
      <rect x="2.8" y="9" width="5.2" height="6" rx="1.6" />
      <rect x="16" y="9" width="5.2" height="6" rx="1.6" />
      <path d="M8 12h8M11 9V6.5M13 15.5V18" />
      <circle cx="11" cy="5.3" r="1.4" />
      <circle cx="13" cy="18.7" r="1.4" />
    </>
  ),
  search: (
    <>
      <circle cx="10.8" cy="10.8" r="6.7" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  sigma: <path d="M17.8 5.2H6.6l5.6 6.8-5.6 6.8h11.2M6.6 5.2h.01" />,
  activity: <path d="M2.8 12h4l2.8-7 4.8 14 2.8-7h4" />,
  check: <path d="m5 12.5 4.6 4.5L19 6.7" />,
  branch: (
    <>
      <circle cx="6.5" cy="5.5" r="2.2" />
      <circle cx="6.5" cy="18.5" r="2.2" />
      <circle cx="17.5" cy="8" r="2.2" />
      <path d="M6.5 7.7v8.6M8.7 8c3.7 0 6.6-.8 6.6 2.2v5.6a2.2 2.2 0 0 0 2.2 2.2" />
    </>
  ),
  box: (
    <>
      <path d="m12 2.8 8.2 4.4v9.6L12 21.2l-8.2-4.4V7.2L12 2.8Z" />
      <path d="m3.8 7.2 8.2 4.5 8.2-4.5M12 11.7v9.5" />
    </>
  ),
  workflow: (
    <>
      <rect x="3" y="3.5" width="6.5" height="5.5" rx="1.7" />
      <rect x="14.5" y="15" width="6.5" height="5.5" rx="1.7" />
      <rect x="3" y="15" width="6.5" height="5.5" rx="1.7" />
      <path d="M6.2 9v6M9.5 17.7h5M16 15V9a2 2 0 0 0-2-2h-4" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M3 3.5 21 21M10.4 6.2A9.6 9.6 0 0 1 12 6c5.8 0 9.5 6 9.5 6a16 16 0 0 1-2.4 3.1M6.1 8.2A16 16 0 0 0 2.5 12s3.7 6 9.5 6a9.4 9.4 0 0 0 3.9-.8M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </>
  ),
  bulb: (
    <>
      <path d="M9.2 18h5.6M10 21h4M8.4 14.4a6.2 6.2 0 1 1 7.2 0c-.8.6-1.2 1.3-1.2 2.2H9.6c0-.9-.4-1.6-1.2-2.2Z" />
    </>
  ),
  robot: (
    <>
      <rect x="4.2" y="7" width="15.6" height="12" rx="3.4" />
      <path d="M12 3v4M8.5 12h.01M15.5 12h.01M9 15.3h6M2.5 11v4M21.5 11v4" />
    </>
  ),
  camera: (
    <>
      <path d="M3.5 8.5h3l1.5-2.6h8L17.5 8.5h3a1.5 1.5 0 0 1 1.5 1.5v7.5a2 2 0 0 1-2 2h-16a2 2 0 0 1-2-2V10a1.5 1.5 0 0 1 1.5-1.5Z" />
      <circle cx="12" cy="13.5" r="3.5" />
    </>
  ),
  chat: (
    <>
      <path d="M20.5 11.5a7.7 7.7 0 0 1-8 7.5 8.7 8.7 0 0 1-3.6-.8L4 20l1.4-4.3a7.1 7.1 0 0 1-1-3.7 7.7 7.7 0 0 1 8-7.5 7.7 7.7 0 0 1 8.1 7.5Z" />
      <path d="M8.8 11.5h.01M12 11.5h.01M15.2 11.5h.01" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.8" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.4" />
    </>
  ),
  building: (
    <>
      <path d="M4 21V5.2A2.2 2.2 0 0 1 6.2 3h7.1A2.2 2.2 0 0 1 15.5 5.2V21M15.5 9H19a2 2 0 0 1 2 2v10M2.5 21h19" />
      <path d="M7.5 7h4.5M7.5 11h4.5M7.5 15h4.5" />
    </>
  ),
  package: (
    <>
      <path d="m12 2.8 8.2 4.4v9.6L12 21.2l-8.2-4.4V7.2L12 2.8Z" />
      <path d="m3.8 7.2 8.2 4.5 8.2-4.5M12 11.7v9.5M7.9 5l8.2 4.5" />
    </>
  ),
  coins: (
    <>
      <ellipse cx="8.5" cy="6.5" rx="5.5" ry="2.7" />
      <path d="M3 6.5v4c0 1.5 2.5 2.7 5.5 2.7s5.5-1.2 5.5-2.7v-4" />
      <path d="M8.5 13.5v3.8c0 1.5 3 2.7 6.5 2.7s6.5-1.2 6.5-2.7v-7c0-1.5-3-2.7-6.5-2.7-1.5 0-2.9.2-4 .7" />
    </>
  ),
  cursor: <path d="m4.5 3.8 6.3 16.4 2.5-6.8 6.8-2.5L4.5 3.8ZM13.3 13.2l5.2 5.2" />,
  orbit: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <ellipse cx="12" cy="12" rx="9" ry="4.2" transform="rotate(-28 12 12)" />
      <circle cx="18.9" cy="6.4" r="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  arrowUpRight: <path d="M7 17 17 7M8.2 7H17v8.8" />,
  arrowRight: <path d="M4 12h16M14 6l6 6-6 6" />,
  arrowLeft: <path d="M20 12H4M10 6l-6 6 6 6" />,
  shuffle: (
    <>
      <path d="M3 7h3.2c4.4 0 6.2 10 10.6 10H21M18 14l3 3-3 3M3 17h3.2c1.4 0 2.5-1 3.5-2.5M14 9.5c.8-1.2 1.7-2.5 2.8-2.5H21M18 4l3 3-3 3" />
    </>
  ),
  copy: (
    <>
      <rect x="8.2" y="8.2" width="12.3" height="12.3" rx="3" />
      <path d="M15.8 8.2V6.5a3 3 0 0 0-3-3H6.5a3 3 0 0 0-3 3v6.3a3 3 0 0 0 3 3h1.7" />
    </>
  ),
  bookmark: <path d="M6 3.8h12a1 1 0 0 1 1 1V21l-7-4.3L5 21V4.8a1 1 0 0 1 1-1Z" />,
  bookmarkFilled: (
    <path
      d="M6 3.5h12a1.2 1.2 0 0 1 1.2 1.2V21l-7.2-4.4L4.8 21V4.7A1.2 1.2 0 0 1 6 3.5Z"
      fill="currentColor"
    />
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.8" />
      <path d="M12 7v5.4l3.4 2" />
    </>
  ),
  timer: (
    <>
      <circle cx="12" cy="13.3" r="7.7" />
      <path d="M9.5 2.5h5M12 5.6V8M18.1 7.2l1.4-1.4M12 13.3l2.8-2.3" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 7h5M13 7h7M4 17h9M17 17h3" />
      <circle cx="11" cy="7" r="2.1" />
      <circle cx="15" cy="17" r="2.1" />
    </>
  ),
  close: <path d="m6 6 12 12M18 6 6 18" />,
  menu: <path d="M4 7.5h16M4 12h16M4 16.5h16" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
    </>
  ),
  moon: <path d="M20.2 14.3A8.3 8.3 0 0 1 9.7 3.8 8.8 8.8 0 1 0 20.2 14.3Z" />,
  chevronDown: <path d="m6 9.5 6 6 6-6" />,
  chevronUp: <path d="m6 14.5 6-6 6 6" />,
  trash: (
    <>
      <path d="M4 6.5h16M9.5 6.5V4.4a1.4 1.4 0 0 1 1.4-1.4h2.2a1.4 1.4 0 0 1 1.4 1.4v2.1M6.5 6.5l.8 13a2 2 0 0 0 2 1.9h5.4a2 2 0 0 0 2-1.9l.8-13M10 10.5v6M14 10.5v6" />
    </>
  ),
  play: <path d="M8 5.5v13l10-6.5-10-6.5Z" />,
  pause: <path d="M8.5 5v14M15.5 5v14" />,
  rotate: <path d="M4 11a8 8 0 1 1 2.3 6.1M4 20v-5h5" />,
  alert: (
    <>
      <path d="M12 3.2 21 19.5H3L12 3.2Z" />
      <path d="M12 9v4.2M12 16.8h.01" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.8" />
      <path d="M12 11v5M12 7.8h.01" />
    </>
  ),
  externalLink: <path d="M14 4h6v6M20 4l-8.5 8.5M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10" />,
  plus: <path d="M12 5v14M5 12h14" />,
  link: (
    <>
      <path d="M10.5 13.5a4.2 4.2 0 0 0 6 0l2.4-2.4a4.2 4.2 0 0 0-6-6l-1.2 1.2" />
      <path d="M13.5 10.5a4.2 4.2 0 0 0-6 0l-2.4 2.4a4.2 4.2 0 0 0 6 6l1.2-1.2" />
    </>
  ),
  flag: (
    <>
      <path d="M5.5 21V4.2" />
      <path d="M5.5 4.5c4.2-2.2 8.8 2.2 13 0v8.6c-4.2 2.2-8.8-2.2-13 0" />
    </>
  ),
  listCheck: (
    <>
      <path d="M10 6h10M10 12h10M10 18h10M3.5 5.5l1.5 1.5 2.5-3M3.5 11.5 5 13l2.5-3M3.5 17.5 5 19l2.5-3" />
    </>
  ),
};

export function Icon({
  name,
  size = 20,
  className,
  'aria-hidden': ariaHidden = true,
  strokeWidth = 1.7,
}: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={ariaHidden}
      focusable="false"
    >
      {paths[name] ?? paths.spark}
    </svg>
  );
}
