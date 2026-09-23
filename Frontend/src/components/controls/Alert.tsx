import type { ReactNode } from "react";
import { IconInfo } from "./icons";
import { cn } from "../../utilities/cn";
import styles from "./Alert.module.css";

export type AlertTone = "info" | "warning" | "error" | "success";

export interface AlertProps {
  tone?: AlertTone;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function Alert({ tone = "info", children, icon, className }: AlertProps) {
  return (
    <div className={cn(styles.alert, styles[tone], className)} role="status">
      <span className={styles.icon}>{icon ?? <IconInfo width={18} height={18} />}</span>
      <div className={styles.body}>{children}</div>
    </div>
  );
}
