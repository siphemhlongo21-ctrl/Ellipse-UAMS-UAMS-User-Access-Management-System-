import type { EnvironmentCode } from "../../types";
import { cn } from "../../utilities/cn";
import styles from "./EnvPill.module.css";

const LABELS: Record<EnvironmentCode, string> = {
  PROD: "PROD",
  TEST: "TEST",
  DEV: "DEV",
};

const TONE_CLASS: Record<EnvironmentCode, string> = {
  PROD: styles.prod,
  TEST: styles.test,
  DEV: styles.dev,
};

export interface EnvPillProps {
  environment: EnvironmentCode;
  className?: string;
}

export function EnvPill({ environment, className }: EnvPillProps) {
  return (
    <span className={cn(styles.pill, TONE_CLASS[environment], className)}>
      {LABELS[environment]}
    </span>
  );
}
