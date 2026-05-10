import Header from '@/components/Header'
import MainNav from '@/components/MainNav'
import MobileNav from '@/components/MobileNav'
import Footer from '@/components/Footer'
import VideoCard from '@/components/VideoCard'
import { videos } from '@/data'

export const metadata = { title: 'Ask an IFBB Pro — NapsGear' }

export default function AskIfbbProPage() {
  return (
    <>
      <Header />
      <MainNav />
      <MobileNav />
      <main className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="mb-6 text-3xl font-bold">Ask an IFBB Pro</h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {videos.map((v) => (
            <VideoCard key={v.url} video={v} />
          ))}
        </div>
      </main>
      <Footer />
    </>
  )
}
