import { IconCheck } from "./icons";
import { cn } from "../../utilities/cn";
import styles from "./Stepper.module.css";

export type StepStatus = "completed" | "active" | "pending";

export interface StepperStep {
  id: string;
  label: string;
  status: StepStatus;
}

export interface StepperProps {
  steps: StepperStep[];
  className?: string;
}

export function Stepper({ steps, className }: StepperProps) {
  return (
    <ol className={cn(styles.stepper, className)} aria-label="Progress">
      {steps.map((step, index) => (
        <li key={step.id} className={cn(styles.step, styles[step.status])}>
          {index > 0 ? <span className={styles.connector} aria-hidden /> : null}
          <span className={styles.marker} aria-hidden>
            {step.status === "completed" ? (
              <IconCheck width={14} height={14} />
            ) : (
              <span className={styles.number}>{index + 1}</span>
            )}
          </span>
          <span className={styles.label}>{step.label}</span>
        </li>
      ))}
    </ol>
  );
}
