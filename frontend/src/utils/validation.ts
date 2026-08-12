// Form validation utilities

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  min?: number;
  max?: number;
  custom?: (value: any) => boolean;
  message: string;
}

export interface ValidationRules {
  [fieldName: string]: ValidationRule[];
}

export interface ValidationErrors {
  [fieldName: string]: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationErrors;
}

// Validate a single field
export function validateField(value: any, rules: ValidationRule[]): string[] {
  const errors: string[] = [];
  const stringValue = String(value ?? '').trim();

  for (const rule of rules) {
    // Required check
    if (rule.required && !stringValue) {
      errors.push(rule.message);
      continue;
    }

    // Skip other validations if empty and not required
    if (!stringValue && !rule.required) continue;

    // Min length check
    if (rule.minLength !== undefined && stringValue.length < rule.minLength) {
      errors.push(rule.message);
    }

    // Max length check
    if (rule.maxLength !== undefined && stringValue.length > rule.maxLength) {
      errors.push(rule.message);
    }

    // Pattern check
    if (rule.pattern && !rule.pattern.test(stringValue)) {
      errors.push(rule.message);
    }

    // Email check
    if (rule.email) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(stringValue)) {
        errors.push(rule.message);
      }
    }

    // Number min check
    if (rule.min !== undefined && Number(value) < rule.min) {
      errors.push(rule.message);
    }

    // Number max check
    if (rule.max !== undefined && Number(value) > rule.max) {
      errors.push(rule.message);
    }

    // Custom validation
    if (rule.custom && !rule.custom(value)) {
      errors.push(rule.message);
    }
  }

  return errors;
}

// Validate entire form
export function validateForm(
  formData: { [key: string]: any },
  rules: ValidationRules
): ValidationResult {
  const errors: ValidationErrors = {};
  let isValid = true;

  for (const [fieldName, fieldRules] of Object.entries(rules)) {
    const fieldErrors = validateField(formData[fieldName], fieldRules);
    if (fieldErrors.length > 0) {
      errors[fieldName] = fieldErrors;
      isValid = false;
    }
  }

  return { isValid, errors };
}

// Pre-built validation rules for common use cases
export const commonRules = {
  email: (): ValidationRule[] => [
    { required: true, message: 'Email is required' },
    { email: true, message: 'Please enter a valid email address' },
  ],

  password: (minLength: number = 8): ValidationRule[] => [
    { required: true, message: 'Password is required' },
    { minLength, message: `Password must be at least ${minLength} characters` },
    {
      pattern: /[A-Z]/,
      message: 'Password must contain at least one uppercase letter',
    },
    {
      pattern: /[a-z]/,
      message: 'Password must contain at least one lowercase letter',
    },
    {
      pattern: /[0-9]/,
      message: 'Password must contain at least one number',
    },
  ],

  name: (): ValidationRule[] => [
    { required: true, message: 'Name is required' },
    { minLength: 2, message: 'Name must be at least 2 characters' },
    { maxLength: 50, message: 'Name cannot exceed 50 characters' },
  ],

  bookTitle: (): ValidationRule[] => [
    { required: true, message: 'Book title is required' },
    { minLength: 1, message: 'Book title cannot be empty' },
    { maxLength: 200, message: 'Book title cannot exceed 200 characters' },
  ],

  isbn: (): ValidationRule[] => [
    { required: true, message: 'ISBN is required' },
    {
      pattern: /^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/,
      message: 'Please enter a valid ISBN',
    },
  ],

  copies: (): ValidationRule[] => [
    { required: true, message: 'Number of copies is required' },
    { min: 1, message: 'Must have at least 1 copy' },
    { max: 100, message: 'Cannot exceed 100 copies' },
  ],
};

// Hook for form validation in React components
export function createFormValidator(rules: ValidationRules) {
  return {
    validate: (formData: { [key: string]: any }) => validateForm(formData, rules),
    validateField: (fieldName: string, value: any) => {
      if (rules[fieldName]) {
        return validateField(value, rules[fieldName]);
      }
      return [];
    },
  };
}
