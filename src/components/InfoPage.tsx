type InfoSection = {
  heading: string
  paragraphs?: string[]
  items?: string[]
}

export default function InfoPage({
  title,
  intro,
  sections,
  cta,
}: {
  title: string
  intro: string
  sections: InfoSection[]
  cta?: { href: string; label: string }
}) {
  return (
    <main className="main">
      <div className="container py-5">
        <article className="ngc-info-page">
          <header className="ngc-info-page__header">
            <h1>{title}</h1>
            <p>{intro}</p>
          </header>
          {sections.map(section => (
            <section key={section.heading} className="ngc-info-page__section">
              <h2>{section.heading}</h2>
              {section.paragraphs?.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
              {section.items && <ul>{section.items.map(item => <li key={item}>{item}</li>)}</ul>}
            </section>
          ))}
          {cta && <a className="ngc-btn ngc-btn--dark" href={cta.href}>{cta.label}</a>}
        </article>
      </div>
    </main>
  )
}
