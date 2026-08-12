import React from 'react';
import './Input.css';

/**
 * Reusable Form Input Component
 */
export const Input = ({
  id,
  name,
  type = 'text',
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  icon,
  rightElement,
  required = false,
  disabled = false,
  autoComplete,
  className = '',
  ...rest
}) => {
  const hasError = Boolean(error);

  return (
    <div className={`input-group ${hasError ? 'has-error' : ''} ${className}`}>
      {label && (
        <label htmlFor={id} className="input-label">
          {label} {required && <span className="required-asterisk">*</span>}
        </label>
      )}

      <div className="input-wrapper">
        {icon && <div className="input-icon-prefix">{icon}</div>}

        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          className={`input-field ${icon ? 'has-prefix' : ''} ${rightElement ? 'has-suffix' : ''}`}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${id}-error` : undefined}
          {...rest}
        />

        {rightElement && <div className="input-icon-suffix">{rightElement}</div>}
      </div>

      {error && (
        <div id={`${id}-error`} className="input-error-message" role="alert">
          <svg
            className="error-icon"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default Input;
