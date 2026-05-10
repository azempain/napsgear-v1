import VideoCard from '@/components/VideoCard'
import { videos } from '@/data'

export const metadata = { title: 'Ask an IFBB Pro — NapsGear' }

export default function AskIfbbProPage() {
  return (
    <main className="main">
      <div className="container py-5">
        <h1 className="mb-4">Ask an IFBB Pro</h1>
        <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
          {videos.map((v) => (
            <div key={v.url} className="col">
              <VideoCard video={v} />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
