/**
 * 상조 서비스 입력 검증
 */

/** 폰번호: 010-XXXX-XXXX */
export function validatePhone(phone: string): boolean {
  return /^010-\d{4}-\d{4}$/.test(phone);
}

/** 한글 이름: 2~5자 */
export function validateKoreanName(name: string): boolean {
  return /^[가-힣]{2,5}$/.test(name);
}

/** 일반 이름: 2자 이상 (한글/영문) */
export function validateName(name: string): boolean {
  return name.trim().length >= 2;
}

export interface ContractFormData {
  customerName: string;
  customerPhone: string;
  serviceType?: string;
  preferredCallTime?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

/** 계약/상담 폼 전체 검증 */
export function validateContractForm(data: ContractFormData): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.customerName || !validateName(data.customerName)) {
    errors.customerName = '이름을 2자 이상 입력해주세요.';
  }

  if (!data.customerPhone || !validatePhone(data.customerPhone)) {
    errors.customerPhone = '전화번호 형식이 올바르지 않습니다. (010-XXXX-XXXX)';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
