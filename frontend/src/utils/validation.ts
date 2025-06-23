export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean;
  message?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateField = (value: any, rules: ValidationRule[]): ValidationResult => {
  const errors: string[] = [];

  for (const rule of rules) {
    if (rule.required && (!value || value.toString().trim() === '')) {
      errors.push(rule.message || 'This field is required');
      continue;
    }

    if (value && rule.minLength && value.toString().length < rule.minLength) {
      errors.push(rule.message || `Minimum length is ${rule.minLength} characters`);
    }

    if (value && rule.maxLength && value.toString().length > rule.maxLength) {
      errors.push(rule.message || `Maximum length is ${rule.maxLength} characters`);
    }

    if (value && rule.pattern && !rule.pattern.test(value.toString())) {
      errors.push(rule.message || 'Invalid format');
    }

    if (value && rule.custom && !rule.custom(value)) {
      errors.push(rule.message || 'Invalid value');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateForm = (data: Record<string, any>, schema: Record<string, ValidationRule[]>): ValidationResult => {
  const allErrors: string[] = [];

  for (const [field, rules] of Object.entries(schema)) {
    const fieldResult = validateField(data[field], rules);
    if (!fieldResult.isValid) {
      allErrors.push(...fieldResult.errors.map(error => `${field}: ${error}`));
    }
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  };
};

// Specific validation functions
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): ValidationResult => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/(?=.*[@$!%*?&])/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validateCreditCard = (cardNumber: string): boolean => {
  // Remove spaces and dashes
  const cleaned = cardNumber.replace(/[\s\-]/g, '');
  
  // Check if it's all digits and has valid length
  if (!/^\d{13,19}$/.test(cleaned)) {
    return false;
  }

  // Luhn algorithm
  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i]);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

export const validateExpiryDate = (expiry: string): boolean => {
  const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
  if (!expiryRegex.test(expiry)) {
    return false;
  }

  const [month, year] = expiry.split('/');
  const now = new Date();
  const currentYear = now.getFullYear() % 100;
  const currentMonth = now.getMonth() + 1;

  const expiryYear = parseInt(year);
  const expiryMonth = parseInt(month);

  if (expiryYear < currentYear) {
    return false;
  }

  if (expiryYear === currentYear && expiryMonth < currentMonth) {
    return false;
  }

  return true;
};

export const validateCVV = (cvv: string): boolean => {
  return /^\d{3,4}$/.test(cvv);
};

// Form schemas
export const loginSchema: Record<string, ValidationRule[]> = {
  email: [
    { required: true, message: 'Email is required' },
    { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email format' }
  ],
  password: [
    { required: true, message: 'Password is required' },
    { minLength: 8, message: 'Password must be at least 8 characters' }
  ]
};

export const registerSchema: Record<string, ValidationRule[]> = {
  firstName: [
    { required: true, message: 'First name is required' },
    { minLength: 2, message: 'First name must be at least 2 characters' },
    { maxLength: 50, message: 'First name must not exceed 50 characters' }
  ],
  lastName: [
    { required: true, message: 'Last name is required' },
    { minLength: 2, message: 'Last name must be at least 2 characters' },
    { maxLength: 50, message: 'Last name must not exceed 50 characters' }
  ],
  email: [
    { required: true, message: 'Email is required' },
    { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email format' }
  ],
  password: [
    { required: true, message: 'Password is required' },
    { minLength: 8, message: 'Password must be at least 8 characters' },
    { 
      custom: (value) => validatePassword(value).isValid,
      message: 'Password must contain uppercase, lowercase, number and special character'
    }
  ],
  confirmPassword: [
    { required: true, message: 'Please confirm your password' }
  ]
};

export const profileSchema: Record<string, ValidationRule[]> = {
  firstName: [
    { required: true, message: 'First name is required' },
    { minLength: 2, message: 'First name must be at least 2 characters' },
    { maxLength: 50, message: 'First name must not exceed 50 characters' }
  ],
  lastName: [
    { required: true, message: 'Last name is required' },
    { minLength: 2, message: 'Last name must be at least 2 characters' },
    { maxLength: 50, message: 'Last name must not exceed 50 characters' }
  ],
  email: [
    { required: true, message: 'Email is required' },
    { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email format' }
  ],
  phone: [
    { pattern: /^\+?[\d\s\-\(\)]{10,}$/, message: 'Invalid phone number format' }
  ]
};