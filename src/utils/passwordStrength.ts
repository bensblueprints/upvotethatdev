export interface PasswordStrengthResult {
  score: number;
  level: 'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong';
  color: string;
  feedback: string[];
}

export function calculatePasswordStrength(password: string): PasswordStrengthResult {
  if (!password) {
    return {
      score: 0,
      level: 'Very Weak',
      color: '#ef4444',
      feedback: ['Enter a password']
    };
  }

  let score = 0;
  const feedback: string[] = [];

  // Length scoring (0-25 points)
  if (password.length >= 8) {
    score += 15;
  } else {
    feedback.push('Use at least 8 characters');
  }
  
  if (password.length >= 12) {
    score += 10;
  } else if (password.length >= 8) {
    feedback.push('Consider using 12+ characters for better security');
  }

  // Character variety (0-60 points total)
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password);

  if (hasLowercase) {
    score += 10;
  } else {
    feedback.push('Add lowercase letters');
  }

  if (hasUppercase) {
    score += 10;
  } else {
    feedback.push('Add uppercase letters');
  }

  if (hasNumbers) {
    score += 15;
  } else {
    feedback.push('Add numbers');
  }

  if (hasSpecialChars) {
    score += 25;
  } else {
    feedback.push('Add special characters (!@#$%^&*)');
  }

  // Complexity bonus (0-15 points)
  const uniqueChars = new Set(password).size;
  if (uniqueChars >= password.length * 0.7) {
    score += 10;
  }

  // No repeated patterns bonus
  if (!/(.)\1{2,}/.test(password)) {
    score += 5;
  } else {
    feedback.push('Avoid repeating characters');
  }

  // Common patterns penalty
  const commonPatterns = [
    /123456/,
    /654321/,
    /qwerty/i,
    /password/i,
    /admin/i,
    /login/i
  ];

  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      score -= 20;
      feedback.push('Avoid common patterns');
      break;
    }
  }

  // Ensure score is between 0-100
  score = Math.max(0, Math.min(100, score));

  // Determine level and color
  let level: PasswordStrengthResult['level'];
  let color: string;

  if (score < 20) {
    level = 'Very Weak';
    color = '#ef4444'; // red-500
  } else if (score < 40) {
    level = 'Weak';
    color = '#f97316'; // orange-500
  } else if (score < 60) {
    level = 'Fair';
    color = '#eab308'; // yellow-500
  } else if (score < 80) {
    level = 'Good';
    color = '#84cc16'; // lime-500
  } else {
    level = 'Strong';
    color = '#22c55e'; // green-500
  }

  // Success feedback
  if (score >= 60) {
    feedback.length = 0; // Clear all feedback for good passwords
    feedback.push('Strong password! 💪');
  }

  return { score, level, color, feedback };
} 