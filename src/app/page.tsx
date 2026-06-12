import HeroCarousel from "@/components/HeroCarousel";
import AmaSection from "@/components/AmaSection";
import QaSection from "@/components/QaSection";
import GearpicsSection from "@/components/GearpicsSection";

export default function HomePage() {
  return (
    <main className="main">
      <div className="notification">
        <section className="body">
          <span className="title">Success</span>
          <p className="message">Item added to cart</p>
        </section>
      </div>

      <div className="container">
        <HeroCarousel />
      </div>

      <div className="welcome-text">
        <strong>NapsGear</strong> The largest marketplace for pharmaceuticals!
      </div>

      <div className="container">
        <AmaSection />
        <QaSection />
        <GearpicsSection />
      </div>
    </main>
  );
}
