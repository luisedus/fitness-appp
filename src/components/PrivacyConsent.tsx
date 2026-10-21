import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface PrivacyConsentProps {
  id: string;
  accepted: boolean;
  onChange: (accepted: boolean) => void;
  error?: string;
  disabled?: boolean;
}

export function PrivacyConsent({ id, accepted, onChange, error, disabled }: PrivacyConsentProps) {
  return (
    <div className="mb-5">
      <div className="flex items-start gap-3">
        <Checkbox
          id={id}
          checked={accepted}
          onCheckedChange={value => onChange(value === true)}
          disabled={disabled}
          required
          aria-label="He leído y acepto el aviso de privacidad"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-1 h-5 w-5"
        />
        <div className="min-w-0 text-sm leading-6 text-secondary-foreground">
          <label htmlFor={id} className="cursor-pointer">He leído y acepto el </label>
          <Button asChild variant="link" className="inline h-auto whitespace-normal p-0 text-sm leading-6 underline">
            <a href="/privacidad" target="_blank" rel="noopener noreferrer">
              aviso de privacidad
              <span className="sr-only"> (abre en una nueva pestaña)</span>
            </a>
          </Button>
          .
        </div>
      </div>
      {error && <p id={`${id}-error`} role="alert" className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}