import { IconCheck, IconClock } from "./icons";
import { cn } from "../../utilities/cn";
import styles from "./StatusPill.module.css";

export type StatusPillTone = "pending" | "approved" | "rejected" | "neutral";

export interface StatusPillProps {
  label: string;
  tone?: StatusPillTone;
  showIcon?: boolean;
  className?: string;
}

export function StatusPill({
  label,
  tone = "pending",
  showIcon = true,
  className,
}: StatusPillProps) {
  return (
    <span className={cn(styles.pill, styles[tone], className)}>
      {showIcon && tone === "pending" ? <IconClock width={14} height={14} /> : null}
      {showIcon && tone === "approved" ? <IconCheck width={14} height={14} /> : null}
      {label}
    </span>
  );
}
