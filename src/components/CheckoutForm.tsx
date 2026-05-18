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
    <div className="checkout-form">
      <h2 className="section-title">Contact &amp; Shipping</h2>
      <div className="row g-3">
        {FIELDS.map(f => (
          <div key={f.name} className={f.full ? 'col-12' : 'col-sm-6'}>
            <label htmlFor={f.name} className="form-label">{f.label}</label>
            <input
              id={f.name}
              name={f.name}
              type={f.type ?? 'text'}
              className={`form-control${errors[f.name] ? ' is-invalid' : ''}`}
              value={form[f.name]}
              required={f.required}
              disabled={disabled}
              aria-invalid={!!errors[f.name]}
              aria-describedby={errors[f.name] ? `${f.name}-err` : undefined}
              onChange={e => onChange(f.name, e.target.value)}
            />
            {errors[f.name] && (
              <div id={`${f.name}-err`} className="invalid-feedback d-block">
                {errors[f.name]}
              </div>
            )}
          </div>
        ))}
        <div className="col-12">
          <label htmlFor="notes" className="form-label">Order notes (optional)</label>
          <textarea
            id="notes"
            name="notes"
            className="form-control"
            rows={3}
            value={form.notes}
            disabled={disabled}
            onChange={e => onChange('notes', e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
