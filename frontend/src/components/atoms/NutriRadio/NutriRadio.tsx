"use client";

import React, { useId } from "react";

import "./NutriRadio.styles.css";

export interface NutriRadioProps {
  id?: string;
  name: string;
  label: React.ReactNode;
  description?: string;
  value: string;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  required?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  ariaDescribedBy?: string;
  error?: string;
}

export const NutriRadio: React.FC<NutriRadioProps> = ({
  id,
  name,
  label,
  description,
  value,
  checked,
  defaultChecked,
  disabled = false,
  required = false,
  onChange,
  ariaDescribedBy,
  error,
}) => {
  const generatedId = useId();
  const inputId = id ?? `nutri-radio-${generatedId}`;
  const descriptionId = description ? `${inputId}-description` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [ariaDescribedBy, descriptionId, errorId].filter(Boolean).join(" ");

  return (
    <label
      className={["nutri-radio", disabled ? "is-disabled" : "", error ? "has-error" : ""].filter(Boolean).join(" ")}
      htmlFor={inputId}
    >
      <span className="nutri-radio__control">
        <input
          id={inputId}
          name={name}
          type="radio"
          className="nutri-radio__input"
          value={value}
          checked={checked}
          defaultChecked={defaultChecked}
          disabled={disabled}
          required={required}
          onChange={onChange}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy || undefined}
        />
        <span className="nutri-radio__outer">
          <span className="nutri-radio__inner" />
        </span>
      </span>
      <span className="nutri-radio__content">
        <span className="nutri-radio__label">{label}</span>
        {description ? (
          <span id={descriptionId} className="nutri-radio__description">
            {description}
          </span>
        ) : null}
        {error ? (
          <span id={errorId} className="nutri-radio__error" role="alert">
            {error}
          </span>
        ) : null}
      </span>
    </label>
  );
};
