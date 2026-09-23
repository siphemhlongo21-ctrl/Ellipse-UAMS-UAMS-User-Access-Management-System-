import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps) {
  const { width = 20, height = 20, ...rest } = props;
  return { width, height, fill: "none", stroke: "currentColor", strokeWidth: 1.75, ...rest };
}

export function IconGrid(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...base(props)}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export function IconDocument(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...base(props)}>
      <path d="M7 3.5h7l5 5V20a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 20V5A1.5 1.5 0 0 1 7 3.5Z" />
      <path d="M14 3.5V9h5.5" />
      <path d="M8.5 13h7M8.5 17h5" />
    </svg>
  );
}

export function IconBell(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...base(props)}>
      <path d="M6.5 17.5h11l-1.2-1.5V11a5.3 5.3 0 1 0-10.6 0v5Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function IconLogout(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...base(props)}>
      <path d="M10 5.5H7A1.5 1.5 0 0 0 5.5 7v10A1.5 1.5 0 0 0 7 18.5h3" />
      <path d="M13 12h7.5M17.5 8.5 21 12l-3.5 3.5" />
    </svg>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...base(props)}>
      <path d="m5.5 12.5 4.2 4.2 8.8-9.4" />
    </svg>
  );
}

export function IconClose(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...base(props)}>
      <path d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5" />
    </svg>
  );
}

export function IconInfo(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...base(props)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 10.5v5M12 7.75v.5" />
    </svg>
  );
}

export function IconClock(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...base(props)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function IconShield(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...base(props)}>
      <path d="M12 3.5 19 6.5v5.2c0 4.6-3 8.2-7 9.8-4-1.6-7-5.2-7-9.8V6.5l7-3Z" />
    </svg>
  );
}

export function IconUser(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...base(props)}>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5.5 19.5c1.8-3.2 4-4.8 6.5-4.8s4.7 1.6 6.5 4.8" />
    </svg>
  );
}

export function IconLock(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...base(props)}>
      <rect x="6" y="10.5" width="12" height="9" rx="1.5" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </svg>
  );
}

export function IconEye(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...base(props)}>
      <path d="M2.5 12S6.5 5.5 12 5.5 21.5 12 21.5 12 17.5 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.75" />
    </svg>
  );
}

export function IconEyeOff(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...base(props)}>
      <path d="M3 3.5 21 20.5" />
      <path d="M9.9 6.1A8.6 8.6 0 0 1 12 5.5C17.5 5.5 21.5 12 21.5 12a15 15 0 0 1-3.2 3.9" />
      <path d="M14.1 14.3A2.75 2.75 0 0 1 9.8 10" />
      <path d="M6.2 8.4A15 15 0 0 0 2.5 12S6.5 18.5 12 18.5c1.1 0 2.1-.2 3.1-.5" />
    </svg>
  );
}

export function IconSearch(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...base(props)}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16.5 16.5 4 4" />
    </svg>
  );
}

export function IconPlus(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...base(props)}>
      <path d="M12 5.5v13M5.5 12h13" />
    </svg>
  );
}

export function IconCalendar(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...base(props)}>
      <rect x="4" y="5.5" width="16" height="14" rx="1.5" />
      <path d="M8 3.5v4M16 3.5v4M4 10h16" />
    </svg>
  );
}

export function IconChart(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...base(props)}>
      <path d="M4.5 19.5h15" />
      <path d="M7 16.5V10M12 16.5V6.5M17 16.5v-4" />
    </svg>
  );
}

export function IconDownload(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...base(props)}>
      <path d="M12 5.5v10M8.5 12 12 15.5 15.5 12" />
      <path d="M5.5 18.5h13" />
    </svg>
  );
}

export function IconUpload(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...base(props)}>
      <path d="M12 15.5V5.5M8.5 9 12 5.5 15.5 9" />
      <path d="M5.5 15.5v3A1.5 1.5 0 0 0 7 20h10a1.5 1.5 0 0 0 1.5-1.5v-3" />
    </svg>
  );
}

export function IconArrowRight(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...base(props)}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
