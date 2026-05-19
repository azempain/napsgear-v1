'use client'
// Presentational shell. Form state lives in checkout/page.tsx so the Place
// Order button can stay in the right rail and call form.handleSubmit().
// Each <form.Field> wires onBlur + onSubmit to the same per-field validator,
// giving errors as soon as the user moves between fields AND on submit.

import type { ReactNode } from 'react'
import type { CheckoutForm as CheckoutFormShape } from '@/lib/checkout'
import { checkoutFieldValidators } from '@/lib/checkout'

// TanStack Form's ReactFormExtendedApi has 12 generic slots; pinning them at
// the boundary is more noise than safety. The page-side useForm<CheckoutForm>
// is where the shape is enforced — here we just need the .Field renderer.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CheckoutFormApi = any
// Minimum shape we actually read off a field's render-prop argument.
interface FieldRenderArg {
  state: { value: string; meta: { errors: unknown[] } }
  handleChange: (v: string) => void
  handleBlur: () => void
}

const FIELDS: {
  name: Exclude<keyof CheckoutFormShape, 'notes'>
  label: string
  type?: string
  required: boolean
  full?: boolean
}[] = [
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
  form,
  disabled,
}: {
  form: CheckoutFormApi
  disabled: boolean
}) {
  return (
    <section className="ngc-checkout-form" aria-label="Contact and shipping">
      <h2 className="ngc-section-title">Contact &amp; Shipping</h2>
      <div className="ngc-form-grid">
        {FIELDS.map(f => (
          <form.Field
            key={f.name}
            name={f.name}
            validators={{
              onBlur: ({ value }: { value: string }) => checkoutFieldValidators[f.name](value),
              onSubmit: ({ value }: { value: string }) => checkoutFieldValidators[f.name](value),
            }}
          >
            {(field: FieldRenderArg): ReactNode => {
              const err = firstError(field.state.meta.errors)
              return (
                <div className={`ngc-field${f.full ? ' ngc-field--full' : ''}${err ? ' is-invalid' : ''}`}>
                  <label htmlFor={f.name} className="ngc-field__label">
                    {f.label}
                    {f.required && <span aria-hidden="true" className="ngc-field__req">*</span>}
                  </label>
                  <input
                    id={f.name}
                    name={f.name}
                    type={f.type ?? 'text'}
                    className={`ngc-input${err ? ' is-invalid' : ''}`}
                    value={field.state.value}
                    required={f.required}
                    disabled={disabled}
                    aria-invalid={err ? 'true' : 'false'}
                    aria-describedby={err ? `${f.name}-err` : undefined}
                    onChange={e => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                  {err && (
                    <div id={`${f.name}-err`} className="ngc-field__err" role="alert">
                      {err}
                    </div>
                  )}
                </div>
              )
            }}
          </form.Field>
        ))}

        <form.Field name="notes">
          {(field: FieldRenderArg): ReactNode => (
            <div className="ngc-field ngc-field--full">
              <label htmlFor="notes" className="ngc-field__label">Order notes (optional)</label>
              <textarea
                id="notes"
                name="notes"
                className="ngc-input ngc-input--area"
                rows={3}
                value={field.state.value}
                disabled={disabled}
                onChange={e => field.handleChange(e.target.value)}
              />
            </div>
          )}
        </form.Field>
      </div>
    </section>
  )
}

// Errors from TanStack Form can be strings, objects, or arrays; pick the first
// printable one.
function firstError(errors: unknown[]): string | undefined {
  for (const e of errors) {
    if (typeof e === 'string' && e) return e
    if (e && typeof e === 'object' && 'message' in e && typeof (e as { message: unknown }).message === 'string') {
      return (e as { message: string }).message
    }
  }
  return undefined
}
