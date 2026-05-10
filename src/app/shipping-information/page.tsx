import Header from '@/components/Header'
import MainNav from '@/components/MainNav'
import MobileNav from '@/components/MobileNav'
import Footer from '@/components/Footer'

export const metadata = { title: 'Shipping Information — NapsGear' }

export default function ShippingPage() {
  return (
    <>
      <Header />
      <MainNav />
      <MobileNav />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="mb-6 text-3xl font-bold">Shipping Information</h1>
        <p className="text-gray-700">
          Content TBD — migrate from <code>offline/shipping-information/index.html</code>.
        </p>
      </main>
      <Footer />
    </>
  )
}
