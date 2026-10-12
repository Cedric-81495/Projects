import { Link } from 'react-router-dom'

export function Header() {
  return (
    <header className="site-header">
      <Link to="/" className="brand">
        <span className="brand-mark">F</span>
        [Firm Name]
      </Link>
      <nav className="site-nav">
        <a href="/#about">About</a>
        <a href="/#services">Products</a>
        <a href="/#achievements">Achievements</a>
        <a href="/#testimonials">Testimonials</a>
        <Link to="/book-consultation" className="btn btn-primary btn-sm">Book a consultation</Link>
      </nav>
    </header>
  )
}
