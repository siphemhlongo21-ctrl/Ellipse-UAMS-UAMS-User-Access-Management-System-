import type { InputHTMLAttributes } from "react";
import { cn } from "../../utilities/cn";
import styles from "./Checkbox.module.css";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  tone?: "accent" | "default";
}

export function Checkbox({
  label,
  id,
  className,
  tone = "accent",
  ...rest
}: CheckboxProps) {
  const fieldId = id ?? rest.name ?? label.replace(/\s+/g, "-").toLowerCase();

  return (
    <label className={cn(styles.root, className)} htmlFor={fieldId}>
      <input id={fieldId} type="checkbox" className={styles.input} {...rest} />
      <span className={styles.box} aria-hidden />
      <span className={cn(styles.label, tone === "default" && styles.labelDefault)}>
        {label}
      </span>
    </label>
  );
}
