import { calculatePasswordStrength, PasswordStrengthResult } from '@/utils/passwordStrength';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

export function PasswordStrength({ password, className = '' }: PasswordStrengthProps) {
  const strength = calculatePasswordStrength(password);

  if (!password) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-600">Password Strength</span>
          <span 
            className="font-medium"
            style={{ color: strength.color }}
          >
            {strength.level} ({strength.score}/100)
          </span>
        </div>
        <Progress 
          value={strength.score} 
          className="h-2"
          indicatorColor={strength.color}
        />
      </div>

      {/* Feedback */}
      {strength.feedback.length > 0 && (
        <Alert 
          className={`text-xs ${
            strength.score >= 60 
              ? 'border-green-200 bg-green-50' 
              : 'border-yellow-200 bg-yellow-50'
          }`}
        >
          {strength.score >= 60 ? (
            <CheckCircle2 className="h-3 w-3" style={{ color: strength.color }} />
          ) : (
            <AlertCircle className="h-3 w-3" style={{ color: strength.color }} />
          )}
          <AlertDescription className="text-xs">
            <ul className="list-disc list-inside space-y-1">
              {strength.feedback.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Minimum requirement warning */}
      {strength.score < 60 && (
        <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
          ⚠️ Minimum strength of 60 required for signup
        </div>
      )}
    </div>
  );
} 