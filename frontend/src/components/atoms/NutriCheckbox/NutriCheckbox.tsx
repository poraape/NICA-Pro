"use client";

import React, { useEffect, useId, useRef } from "react";

import "./NutriCheckbox.styles.css";

export interface NutriCheckboxProps {
  id?: string;
  name?: string;
  label: React.ReactNode;
  description?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  required?: boolean;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  ariaDescribedBy?: string;
  error?: string;
}

export const NutriCheckbox: React.FC<NutriCheckboxProps> = ({
  id,
  name,
  label,
  description,
  checked,
  defaultChecked,
  indeterminate = false,
  disabled = false,
  required = false,
  value,
  onChange,
  ariaDescribedBy,
  error,
}) => {
  const generatedId = useId();
  const inputId = id ?? `nutri-checkbox-${generatedId}`;
  const descriptionId = description ? `${inputId}-description` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  const describedBy = [ariaDescribedBy, descriptionId, errorId].filter(Boolean).join(" ");

  return (
    <label
      className={["nutri-checkbox", disabled ? "is-disabled" : "", error ? "has-error" : ""].filter(Boolean).join(" ")}
      htmlFor={inputId}
    >
      <span className="nutri-checkbox__control">
        <input
          ref={inputRef}
          id={inputId}
          name={name}
          type="checkbox"
          className="nutri-checkbox__input"
          checked={checked}
          defaultChecked={defaultChecked}
          disabled={disabled}
          required={required}
          value={value}
          onChange={onChange}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy || undefined}
        />
        <span className="nutri-checkbox__box" data-state={indeterminate ? "mixed" : checked ? "checked" : "unchecked"}>
          <span className="nutri-checkbox__mark" />
        </span>
      </span>
      <span className="nutri-checkbox__content">
        <span className="nutri-checkbox__label">{label}</span>
        {description ? (
          <span id={descriptionId} className="nutri-checkbox__description">
            {description}
          </span>
        ) : null}
        {error ? (
          <span id={errorId} className="nutri-checkbox__error" role="alert">
            {error}
          </span>
        ) : null}
      </span>
    </label>
  );
};
