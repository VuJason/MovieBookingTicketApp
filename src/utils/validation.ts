export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export class ValidationUtils {
  static validateEmail(email: string): ValidationResult {
    if (!email.trim()) {
      return { isValid: false, message: 'Vui lòng nhập email' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, message: 'Vui lòng nhập địa chỉ email hợp lệ' };
    }

    return { isValid: true };
  }

  static validatePassword(password: string): ValidationResult {
    if (!password.trim()) {
      return { isValid: false, message: 'Vui lòng nhập mật khẩu' };
    }

    if (password.length < 6) {
      return { isValid: false, message: 'Mật khẩu phải có ít nhất 6 ký tự' };
    }

    return { isValid: true };
  }

  static validateLoginForm(email: string, password: string): ValidationResult {
    const emailValidation = this.validateEmail(email);
    if (!emailValidation.isValid) {
      return emailValidation;
    }

    const passwordValidation = this.validatePassword(password);
    if (!passwordValidation.isValid) {
      return passwordValidation;
    }

    return { isValid: true };
  }

  static validateName(name: string): ValidationResult {
    if (!name.trim()) {
      return { isValid: false, message: 'Vui lòng nhập họ tên' };
    }

    if (name.trim().length < 2) {
      return { isValid: false, message: 'Họ tên phải có ít nhất 2 ký tự' };
    }

    return { isValid: true };
  }

  static validatePhone(phone: string): ValidationResult {
    if (!phone.trim()) {
      return { isValid: false, message: 'Vui lòng nhập số điện thoại' };
    }

    const phoneRegex = /^[\+]?[0-9]{10,15}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      return { isValid: false, message: 'Vui lòng nhập số điện thoại hợp lệ' };
    }

    return { isValid: true };
  }
}