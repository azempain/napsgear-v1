export default function Loading() {
  return (
    <main className="main">
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="text-muted mt-3">Loading...</p>
      </div>
    </main>
  )
}
