import type { SelectHTMLAttributes } from "react";
import { cn } from "../../utilities/cn";
import styles from "./Select.module.css";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  hint?: string;
  error?: string;
  mandatory?: boolean;
  placeholder?: string;
  hideLabel?: boolean;
}

export function Select({
  label,
  options,
  hint,
  error,
  mandatory = false,
  placeholder,
  hideLabel = false,
  id,
  className,
  disabled,
  ...rest
}: SelectProps) {
  const fieldId = id ?? rest.name ?? label.replace(/\s+/g, "-").toLowerCase();

  return (
    <label className={cn(styles.field, className)} htmlFor={fieldId}>
      <span className={hideLabel ? styles.srOnly : styles.label}>
        {label}
        {mandatory ? <span className={styles.required}>*</span> : null}
      </span>
      <span className={cn(styles.control, error && styles.controlError, disabled && styles.controlMuted)}>
        <select
          id={fieldId}
          className={styles.select}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          {...rest}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
      </span>
      {error ? <span className={styles.error}>{error}</span> : null}
      {!error && hint ? <span className={styles.hint}>{hint}</span> : null}
    </label>
  );
}
