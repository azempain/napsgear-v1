import { brands, categories } from '@/data'

export default function MainNav() {
  return (
    <nav className="main-nav sticky-header desktop-sticky" id="mainMenuNav">
      <div className="container">
        <div className="menu-items d-flex">

          {/* BRANDS — mega-menu */}
          <div className="menu-item menu-item-dropdown">
            <button className="dropdown-button" data-bs-toggle="dropdown"
              data-bs-target="#brandsMenu" aria-expanded="false">Brands</button>
            <div className="dropdown-menu mega-menu" id="brandsMenu" data-bs-parent="#mainMenuNav">
              <div className="menu-item__content">
                {brands.filter(b => b.slug).map(b => (
                  <a key={b.slug} className="menu-item__link main-brand"
                    href={`/brands/${b.slug!}/`}>{b.name}</a>
                ))}
              </div>
            </div>
          </div>

          {/* CATEGORIES — mega-menu */}
          <div className="menu-item menu-item-dropdown">
            <button className="dropdown-button" data-bs-toggle="dropdown"
              data-bs-target="#categoriesMenu" aria-expanded="false">Categories</button>
            <div className="dropdown-menu mega-menu" id="categoriesMenu" data-bs-parent="#mainMenuNav">
              <div className="menu-item__content">
                {categories.map(c => (
                  <a key={c.slug} className="menu-item__link"
                    href={`/categories/${c.slug}/`}>{c.name}</a>
                ))}
              </div>
            </div>
          </div>

          {/* SHIPPING LOCATIONS */}
          <div className="menu-item menu-item-dropdown">
            <button className="dropdown-button" data-bs-toggle="dropdown"
              data-bs-target="#locationsMenu" aria-expanded="false">Shipping Locations</button>
            <div className="dropdown-menu" id="locationsMenu" data-bs-parent="#mainMenuNav">
              <ul>
                <li><a className="menu-item__link" href="/shipping-information/">US Domestic</a></li>
                <li><a className="menu-item__link" href="/shipping-information/">International</a></li>
                <li><a className="menu-item__link" href="/shipping-information/">European Pharmacies</a></li>
                <li><a className="menu-item__link" href="/shipping-information/">Turkish Pharmacies</a></li>
                <li><a className="menu-item__link" href="/shipping-information/">Singapore Pharmacies</a></li>
              </ul>
            </div>
          </div>

          {/* PROMOTIONS */}
          <div className="menu-item menu-item-dropdown">
            <button className="dropdown-button" data-bs-toggle="dropdown"
              data-bs-target="#promotionsMenu" aria-expanded="false">Promotions</button>
            <div className="dropdown-menu" id="promotionsMenu" data-bs-parent="#mainMenuNav">
              <ul>
                <li><h5 className="menu-item__title nolink">Earn Store Credit</h5></li>
                <li><a className="menu-item__link" href="#">NapsGear AAS Diaries</a></li>
                <li><a className="menu-item__link" href="#">Affiliate Partner Program</a></li>
                <li><a className="menu-item__link" href="#">Share Your Gear Pics</a></li>
                <li><h5 className="menu-item__title nolink">Products on Sale</h5></li>
                <li><a className="menu-item__link" href="#">Supplier Super Deals</a></li>
                <li><a className="menu-item__link" href="#">Product of the Week</a></li>
                <li><a className="menu-item__link" href="#">All Recent Promotions</a></li>
              </ul>
            </div>
          </div>

          {/* INFO & ENTERTAINMENT */}
          <div className="menu-item menu-item-dropdown">
            <button className="dropdown-button" data-bs-toggle="dropdown"
              data-bs-target="#infoMenu" aria-expanded="false">Info &amp; Entertainment</button>
            <div className="dropdown-menu" id="infoMenu" data-bs-parent="#mainMenuNav">
              <ul>
                <li><a className="menu-item__link" href="/ask-an-ifbb-pro/">Ask an IFBB Pro Anything</a></li>
                <li><a className="menu-item__link" href="#">NapsGear AAS Diaries</a></li>
                <li><a className="menu-item__link" href="/why-naps/">Why Buy from NapsGear</a></li>
                <li><a className="menu-item__link" href="#">Laboratory Tests</a></li>
                <li><a className="menu-item__link" href="#">Community Gear Pics</a></li>
                <li><a className="menu-item__link" href="#">LIVE Q&amp;A Forums</a></li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </nav>
  )
}
