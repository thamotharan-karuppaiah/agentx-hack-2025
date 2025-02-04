interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateCode = (code: string, language: string): ValidationResult => {
  try {
    if (language === 'javascript') {
      // Basic JavaScript syntax validation
      new Function(code);
      return { isValid: true };
    } else if (language === 'python') {
      // Basic Python syntax validation (very simple)
      if (!code.trim()) return { isValid: true };
      
      // Check for basic Python syntax errors
      const lines = code.split('\n');
      let indentLevel = 0;
      for (const line of lines) {
        if (line.trim().endsWith(':')) {
          indentLevel++;
        } else if (line.trim() && !line.startsWith(' '.repeat(indentLevel * 4))) {
          return { isValid: false, error: 'Invalid indentation' };
        }
      }
      return { isValid: true };
    }
    return { isValid: true };
  } catch (err: any) {
    return { isValid: false, error: err.message };
  }
}; 