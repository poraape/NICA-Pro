"use client";

import React, { useEffect, useId, useState } from "react";

import "./NutriInput.styles.css";

export type NutriInputVariant = "text" | "number" | "search" | "textarea";

type InputElement = HTMLInputElement | HTMLTextAreaElement;

export interface NutriInputProps {
  id?: string;
  name?: string;
  label: string;
  variant?: NutriInputVariant;
  value?: string | number;
  defaultValue?: string | number;
  placeholder?: string;
  description?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  rows?: number;
  onChange?: (event: React.ChangeEvent<InputElement>) => void;
  onFocus?: (event: React.FocusEvent<InputElement>) => void;
  onBlur?: (event: React.FocusEvent<InputElement>) => void;
  ariaDescribedBy?: string;
}

export const NutriInput: React.FC<NutriInputProps> = ({
  id,
  name,
  label,
  variant = "text",
  value,
  defaultValue,
  placeholder,
  description,
  error,
  disabled = false,
  required = false,
  rows = 4,
  onChange,
  onFocus,
  onBlur,
  ariaDescribedBy,
}) => {
  const generatedId = useId();
  const inputId = id ?? `nutri-input-${generatedId}`;
  const descriptionId = description ? `${inputId}-description` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const [uncontrolledValue, setUncontrolledValue] = useState<string | number | undefined>(defaultValue);
  const [isFocused, setIsFocused] = useState(false);
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : uncontrolledValue;
  const isFilled = currentValue !== undefined && `${currentValue}`.length > 0;

  const describedBy = [ariaDescribedBy, descriptionId, errorId].filter(Boolean).join(" ");

  const handleChange = (event: React.ChangeEvent<InputElement>) => {
    if (!isControlled) {
      setUncontrolledValue(event.target.value);
    }
    onChange?.(event);
  };

  const handleFocus = (event: React.FocusEvent<InputElement>) => {
    setIsFocused(true);
    onFocus?.(event);
  };

  const handleBlur = (event: React.FocusEvent<InputElement>) => {
    setIsFocused(false);
    onBlur?.(event);
  };

  const inputProps = {
    id: inputId,
    name,
    disabled,
    required,
    placeholder,
    "aria-invalid": Boolean(error),
    "aria-describedby": describedBy || undefined,
    value,
    defaultValue,
    onChange: handleChange,
    onFocus: handleFocus,
    onBlur: handleBlur,
  } satisfies React.InputHTMLAttributes<HTMLInputElement> &
    React.TextareaHTMLAttributes<HTMLTextAreaElement>;

  const renderInput = () => {
    if (variant === "textarea") {
      return <textarea {...inputProps} rows={rows} className="nutri-input__field" />;
    }

    return <input {...inputProps} type={variant} className="nutri-input__field" />;
  };

  useEffect(() => {
    if (disabled) {
      setIsFocused(false);
    }
  }, [disabled]);

  return (
    <div
      className={[
        "nutri-input",
        `nutri-input--${variant}`,
        isFocused ? "is-focused" : "",
        isFilled ? "is-filled" : "",
        error ? "has-error" : "",
        disabled ? "is-disabled" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <label className="nutri-input__label" htmlFor={inputId}>
        {label}
      </label>
      <div className="nutri-input__control" data-state={error ? "error" : isFocused ? "focused" : "rest"}>
        {renderInput()}
      </div>
      {description ? (
        <p id={descriptionId} className="nutri-input__description">
          {description}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="nutri-input__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
};
