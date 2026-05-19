'use client'
import type { CheckoutForm } from '@/lib/checkout'

const FIELDS: { name: keyof CheckoutForm; label: string; type?: string; required: boolean; full?: boolean }[] = [
  { name: 'fullName', label: 'Full name', required: true, full: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'phone', label: 'Phone', type: 'tel', required: true },
  { name: 'address1', label: 'Address line 1', required: true, full: true },
  { name: 'address2', label: 'Address line 2 (optional)', required: false, full: true },
  { name: 'city', label: 'City', required: true },
  { name: 'state', label: 'State / Region', required: true },
  { name: 'postalCode', label: 'Postal code', required: true },
  { name: 'country', label: 'Country', required: true },
]

export default function CheckoutForm({
  form, errors, disabled, onChange,
}: {
  form: CheckoutForm
  errors: Record<string, string>
  disabled: boolean
  onChange: (name: keyof CheckoutForm, value: string) => void
}) {
  return (
    <section className="ngc-checkout-form" aria-label="Contact and shipping">
      <h2 className="ngc-section-title">Contact &amp; Shipping</h2>
      <div className="ngc-form-grid">
        {FIELDS.map(f => (
          <div
            key={f.name}
            className={`ngc-field${f.full ? ' ngc-field--full' : ''}${errors[f.name] ? ' is-invalid' : ''}`}
          >
            <label htmlFor={f.name} className="ngc-field__label">
              {f.label}
              {f.required && <span aria-hidden="true" className="ngc-field__req">*</span>}
            </label>
            <input
              id={f.name}
              name={f.name}
              type={f.type ?? 'text'}
              className={`ngc-input${errors[f.name] ? ' is-invalid' : ''}`}
              value={form[f.name]}
              required={f.required}
              disabled={disabled}
              aria-invalid={!!errors[f.name]}
              aria-describedby={errors[f.name] ? `${f.name}-err` : undefined}
              onChange={e => onChange(f.name, e.target.value)}
            />
            {errors[f.name] && (
              <div id={`${f.name}-err`} className="ngc-field__err" role="alert">
                {errors[f.name]}
              </div>
            )}
          </div>
        ))}
        <div className="ngc-field ngc-field--full">
          <label htmlFor="notes" className="ngc-field__label">Order notes (optional)</label>
          <textarea
            id="notes"
            name="notes"
            className="ngc-input ngc-input--area"
            rows={3}
            value={form.notes}
            disabled={disabled}
            onChange={e => onChange('notes', e.target.value)}
          />
        </div>
      </div>
    </section>
  )
}
