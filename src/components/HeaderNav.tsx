import { ChevronDown } from 'lucide-react'

const Chevron = () => <ChevronDown size={13} strokeWidth={2.5} className="nav-chevron" />

export default function HeaderNav() {
  return (
    <nav id="mainMenuNav" className="main-nav w-100">
      <ul className="menu">

        {/* ── Brands ── 4-column megamenu */}
        <li className="menu-item menu-item-dropdown with-megamenu dropdown">
          <button type="button" className="dropdown-button" data-bs-toggle="dropdown" data-bs-display="static" aria-expanded="false">Brands <Chevron /></button>
          <div className="dropdown-menu">
            <ul className="menu-item__list menu-item__list--brands">
              <li><a className="menu-item__link main-brand link--has-sub" href="/brands/us-domestic-c147753">U.S. Domestic</a></li>
              <li><a className="menu-item__link main-brand" href="/brands/alpha-pharma-healthcare-c141952">Alpha-Pharma Healthcare <span className="badge-new">NEW</span></a></li>
              <li><a className="menu-item__link main-brand" href="/brands/maxtreme-pharma-c145523">Maxtreme Pharma <span className="badge-new">NEW</span></a></li>
              <li><a className="menu-item__link main-brand" href="/brands/deus-medical-europe-c146933">Deus Medical, Europe</a></li>
              <li><a className="menu-item__link main-brand" href="/brands/euro-pharmacies-europe-c146578">Euro-Pharmacies, Europe</a></li>
              <li><a className="menu-item__link main-brand" href="/brands/bioteq-labs-europe-c147902">Bioteq Labs, Europe (UK)</a></li>
              <li><a className="menu-item__link main-brand" href="/brands/ultima-pharmaceuticals-c144304">Ultima Pharmaceuticals</a></li>
              <li><a className="menu-item__link main-brand" href="/brands/genshi-labs-c145954">Genshi Labs <span className="badge-promo">PROMO</span></a></li>
              <li><a className="menu-item__link main-brand" href="/brands/nakon-medical-c145333">Nakon Medical</a></li>
              <li><a className="menu-item__link main-brand" href="/brands/beligas-c142048">Beligas</a></li>
              <li><a className="menu-item__link main-brand" href="/brands/pharmaqo-labs-c142576">Pharmaqo Labs</a></li>
              <li><a className="menu-item__link main-brand" href="/brands/dragon-pharma-c146050">Dragon Pharma</a></li>
              <li><a className="menu-item__link main-brand" href="/brands/geneza-pharmaceuticals-c142291">Geneza Pharmaceuticals</a></li>
              <li><a className="menu-item__link main-brand" href="/brands/generic-asia-c147840">Generic Asia</a></li>
              <li><a className="menu-item__link main-brand" href="/brands/bm-pharmaceuticals-c147848">BM Pharmaceuticals <span className="badge-new">NEW</span></a></li>
              <li><a className="menu-item__link main-brand" href="/brands/magnum-pharma-c147850">Magnum Pharma <span className="badge-new">NEW</span></a></li>
              <li><a className="menu-item__link main-brand" href="/brands/other-pharmacy-steroid-brands-c147845">Other Pharmacy Steroid Brands</a></li>
              <li><a className="menu-item__link main-brand" href="/brands/india-pharmacy-steroids-c147843">India Pharmacy Steroids</a></li>
              <li><a className="menu-item__link main-brand" href="/brands/insulins-amp-biguanides-c43">Insulins &amp; Biguanides</a></li>
              <li><a className="menu-item__link main-brand" href="/brands/human-growth-hormone-c45">Human Growth Hormone</a></li>
              <li><a className="menu-item__link main-brand" href="/brands/syringes-needles-c879">Syringes &amp; Needles</a></li>
              <li><a className="menu-item__link main-brand link--has-sub" href="/brands/peptides-c147555">Peptides</a></li>
              <li><a className="menu-item__link main-brand link--has-sub" href="/brands/sarms-c148012">SARMs</a></li>
              <li><a className="menu-item__link main-brand link--has-sub" href="/brands/singapore-pharmacies-c147841">Singapore Pharmacies</a></li>
              <li><a className="menu-item__link main-brand link--has-sub" href="/brands/turkish-pharma-c147846">Turkish Pharmacies</a></li>
              <li><a className="menu-item__link main-brand link--has-sub" href="/brands/herbals-c147844">Herbals</a></li>
            </ul>
          </div>
        </li>

        {/* ── Categories ── 4-column megamenu */}
        <li className="menu-item menu-item-dropdown with-megamenu dropdown">
          <button type="button" className="dropdown-button" data-bs-toggle="dropdown" data-bs-display="static" aria-expanded="false">Categories <Chevron /></button>
          <div className="dropdown-menu">
            <ul className="menu-item__list menu-item__list--categories">
              <li><a className="menu-item__link main-category link--has-sub" href="/categories/us-domestic-c147753">U.S. Domestic</a></li>
              <li><a className="menu-item__link main-category" href="/categories/oral-steroids-c23">Oral Steroids</a></li>
              <li><a className="menu-item__link main-category" href="/categories/injectable-steroids-c21">Injectable Steroids</a></li>
              <li><a className="menu-item__link main-category" href="/categories/cycle-support-c867">Cycle Support</a></li>
              <li><a className="menu-item__link main-category" href="/categories/human-growth-hormone-c45">Human Growth Hormone</a></li>
              <li><a className="menu-item__link main-category link--has-sub" href="/categories/peptides-c147555">Peptides</a></li>
              <li><a className="menu-item__link main-category link--has-sub" href="/categories/sarms-c148012">SARMs</a></li>
              <li><a className="menu-item__link main-category" href="/categories/insulins-amp-biguanides-c43">Insulins &amp; Biguanides</a></li>
              <li><a className="menu-item__link main-category" href="/categories/pre-designed-stacks-c42">Pre-designed Stacks</a></li>
              <li><a className="menu-item__link main-category link--has-sub" href="/categories/singapore-pharmacies-c147841">Singapore Pharmacies</a></li>
              <li><a className="menu-item__link main-category link--has-sub" href="/categories/turkish-pharma-c147846">Turkish Pharmacies</a></li>
              <li><a className="menu-item__link main-category link--has-sub" href="/categories/herbals-c147844">Herbals</a></li>
              <li><a className="menu-item__link main-category" href="/categories/syringes-needles-c879">Syringes &amp; Needles</a></li>
            </ul>
          </div>
        </li>

        {/* ── Shipping Locations ── 3-column megamenu */}
        <li className="menu-item menu-item-dropdown with-megamenu dropdown">
          <button type="button" className="dropdown-button" data-bs-toggle="dropdown" data-bs-display="static" aria-expanded="false">Shipping Locations <Chevron /></button>
          <div className="dropdown-menu">
            <ul className="menu-item__list menu-item__list--shipping">
              <li><a className="menu-item__link" href="/brands/us-domestic-c147753">Shipped from USA</a></li>
              <li><a className="menu-item__link" href="/brands/euro-pharmacies-europe-c146578">Shipped from Europe</a></li>
              <li><a className="menu-item__link" href="/brands/generic-asia-c147840">Shipped from Asia</a></li>
              <li><a className="menu-item__link" href="/brands/turkish-pharma-c147846">Turkish Pharmacies</a></li>
              <li><a className="menu-item__link" href="/brands/singapore-pharmacies-c147841">Singapore Pharmacies</a></li>
            </ul>
          </div>
        </li>

        {/* ── Promotions ── regular dropdown */}
        <li className="menu-item menu-item-dropdown dropdown">
          <button type="button" className="dropdown-button" data-bs-toggle="dropdown" data-bs-display="static" aria-expanded="false">Promotions <Chevron /></button>
          <div className="dropdown-menu">
            <a className="menu-item__link" href="#">Earn Store Credit</a>
            <a className="menu-item__link" href="#">NapsGear AAS Diaries <span className="badge-new">NEW</span></a>
            <a className="menu-item__link" href="#">Affiliate Partner Program</a>
            <a className="menu-item__link" href="#">Reviews for Cash</a>
            <a className="menu-item__link" href="#">Share Your Gear Pics</a>
            <a className="menu-item__link" href="#">Refer NapsGear for Cash</a>
            <a className="menu-item__link" href="#">Flat 20% Cashback</a>
            <div className="menu-item__title">Products on Sale</div>
            <a className="menu-item__link" href="#">Supplier Super Deals <span className="badge-new">NEW</span></a>
            <a className="menu-item__link" href="#">Product of the Week</a>
            <a className="menu-item__link" href="#">All Recent Promotions</a>
          </div>
        </li>

        {/* ── Info & Entertainment ── regular dropdown */}
        <li className="menu-item menu-item-dropdown dropdown">
          <button type="button" className="dropdown-button" data-bs-toggle="dropdown" data-bs-display="static" aria-expanded="false">Info &amp; Entertainment <Chevron /></button>
          <div className="dropdown-menu">
            <a className="menu-item__link" href="/ask-an-ifbb-pro/">Ask an IFBB Pro Anything</a>
            <a className="menu-item__link" href="#">NapsGear AAS Diaries</a>
            <a className="menu-item__link" href="#">Why Buy from NapsGear</a>
            <a className="menu-item__link" href="#">Laboratory Tests</a>
            <a className="menu-item__link" href="#">Project Get Shredded</a>
            <a className="menu-item__link" href="#">Community Gear Pics</a>
            <a className="menu-item__link" href="#">LIVE Q&amp;A Forums</a>
          </div>
        </li>

      </ul>
    </nav>
  )
}
