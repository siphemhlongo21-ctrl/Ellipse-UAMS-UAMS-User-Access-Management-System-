import type { ReactNode } from "react";
import { cn } from "../../utilities/cn";
import styles from "./Badge.module.css";

export type BadgeTone =
  | "neutral"
  | "navy"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "yellow";

export interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}

export function Badge({ children, tone = "neutral", className }: BadgeProps) {
  return <span className={cn(styles.badge, styles[tone], className)}>{children}</span>;
}
