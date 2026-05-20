import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Promotions',
  description: 'Current deals, discounts, and pack bundles at NapsGear.',
  alternates: { canonical: '/promotions/' },
}

export default function PromotionsPage() {
  return (
    <main className="main">
      <div className="container py-5">
        <h1 className="mb-4">All Promotions</h1>

        <p>
          NapsGear works exclusively with the most reputable suppliers in this
          market. And for that, we are one of the largest and most trusted online
          retailers. Our suppliers go through a review process of quality control
          and maintenance of reputation before we allow them in our store. We have
          carefully selected these brands to ensure the highest product quality and
          longevity.
        </p>
        <p>
          Our available payment options are bank wire transfer (USA only), Card
          Payment, Venmo, Zelle, Bitcoin, Litecoin, Monero, USDT-ERC20, USDT-TRC20,
          Western Union and Moneygram (USD only). Debit cards may be used to fill
          your Bitcoin and Litecoin wallets. Any unlisted payment methods are not
          accepted. Detailed directions are provided in checkout, once your
          selection is made.
        </p>
        <p>
          Below you will find a list of all current promotions. Some are ongoing and
          some are for a limited time.
        </p>

        <h2 className="section-title mt-5">Earn Store Credit</h2>
        <ul>
          <li>Affiliate Partner Program</li>
          <li>Reviews for Cash</li>
          <li>Share Your Gear Pics</li>
          <li>NapsGear AAS Diaries</li>
          <li>Refer NapsGear for Cash</li>
          <li>Flat 20% Cashback</li>
        </ul>

        <h2 className="section-title mt-5">Products on Sale</h2>
        <ul>
          <li>Supplier Super Deals</li>
          <li>Product of the Week</li>
          <li>Ask Me Anything</li>
        </ul>

        <p className="text-muted mt-4">
          <small>
            Offer may not be combined with any other sale, promotions, coupon, bulk
            discounts, and/or offer.
          </small>
        </p>
      </div>
    </main>
  )
}
