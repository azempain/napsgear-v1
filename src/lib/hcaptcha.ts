// hCaptcha site key. The site key is PUBLIC by design (it identifies the
// widget; the secret key lives only in the Web3Forms / auth-provider
// dashboards). The fallback is hCaptcha's official always-passes TEST key, so
// the widget renders in local dev without configuration. Set the real key via
// NEXT_PUBLIC_HCAPTCHA_SITE_KEY in the Vercel project for production.
//
// hCaptcha test keys: https://docs.hcaptcha.com/#integration-testing-test-keys
export const HCAPTCHA_SITE_KEY =
  process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY ?? '10000000-ffff-ffff-ffff-000000000001'

/** True when a production (non-test) site key is configured. UIs can use this
 *  to decide whether the captcha is a hard gate or a best-effort dev no-op. */
export const HCAPTCHA_CONFIGURED =
  HCAPTCHA_SITE_KEY !== '10000000-ffff-ffff-ffff-000000000001'

export const HCAPTCHA_SCRIPT_SRC = 'https://js.hcaptcha.com/1/api.js?render=explicit'
