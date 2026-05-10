import Header from '@/components/Header'
import MainNav from '@/components/MainNav'
import MobileNav from '@/components/MobileNav'
import Footer from '@/components/Footer'

export const metadata = { title: 'Contact Us — NapsGear' }

export default function ContactPage() {
  return (
    <>
      <Header />
      <MainNav />
      <MobileNav />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="mb-6 text-3xl font-bold">Contact Us</h1>
        <p className="text-gray-700">
          Content TBD — migrate from <code>offline/contact-us/index.html</code>.
        </p>
      </main>
      <Footer />
    </>
  )
}
