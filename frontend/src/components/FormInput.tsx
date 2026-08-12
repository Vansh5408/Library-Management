import React from 'react';
import '../styles/FormInput.css';

interface FormInputProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'textarea';
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  errors?: string[];
  required?: boolean;
  disabled?: boolean;
  min?: number;
  max?: number;
  rows?: number;
  icon?: string;
  helpText?: string;
}

const FormInput: React.FC<FormInputProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  errors = [],
  required = false,
  disabled = false,
  min,
  max,
  rows = 3,
  icon,
  helpText,
}) => {
  const hasErrors = errors.length > 0;

  const inputProps = {
    id: name,
    name,
    value,
    onChange,
    onBlur,
    placeholder,
    disabled,
    className: `form-input ${hasErrors ? 'input-error' : ''}`,
    'aria-describedby': hasErrors ? `${name}-error` : undefined,
    'aria-invalid': hasErrors,
  };

  return (
    <div className="form-group">
      <label htmlFor={name} className="form-label">
        {icon && <span className="label-icon">{icon}</span>}
        {label}
        {required && <span className="required-asterisk">*</span>}
      </label>

      <div className="input-wrapper">
        {type === 'textarea' ? (
          <textarea {...inputProps} rows={rows} />
        ) : (
          <input {...inputProps} type={type} min={min} max={max} />
        )}
      </div>

      {helpText && !hasErrors && (
        <p className="help-text">{helpText}</p>
      )}

      {hasErrors && (
        <div id={`${name}-error`} className="error-messages" role="alert">
          {errors.map((error, index) => (
            <p key={index} className="error-text">
              <span className="error-icon">⚠️</span>
              {error}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

export default FormInput;
