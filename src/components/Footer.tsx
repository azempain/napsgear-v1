import NapsGearLogo from './NapsGearLogo'
import FooterLinks from './FooterLinks'
import FooterAbout from './FooterAbout'

export default function Footer() {
  return (
    <footer className="footer bg-dark position-relative">
      <div className="footer-middle">
        <div className="container">
          <div className="footer-inner">

            <a href="/" className="logo">
              <NapsGearLogo />
            </a>

            <div className="footer-widgets">
              <FooterLinks />
              <FooterAbout />
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container text-center">
          <span className="footer-copyright">Copyright &copy; 2011 - 2026 All rights reserved &ldquo;NapsGear&rdquo;</span>
        </div>
      </div>
    </footer>
  )
}
