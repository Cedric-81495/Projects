const WHO_I_HELP = [
  'Healthcare professionals',
  'Business owners & entrepreneurs',
  'OFWs & remote workers',
  'Parents & young families',
]

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-row">
        <div className="footer-brand">
          <div className="footer-brand-name">[Firm Name]</div>
          <p>[Advisor Name], licensed financial advisor with [Company Name]. Serving [region placeholder].</p>
        </div>
        <div className="footer-col">
          <div className="footer-col-title">Who I help</div>
          <nav className="footer-nav">
            {WHO_I_HELP.map((who) => (
              <a href="#" key={who}>{who}</a>
            ))}
          </nav>
        </div>
        <div className="footer-col">
          <div className="footer-col-title">Get in touch</div>
          <nav className="footer-nav">
            <a href="/#about">About</a>
            <a href="/#services">Products</a>
            <a href="/#testimonials">Testimonials</a>
            <a href="/book-consultation">Book a consultation</a>
          </nav>
        </div>
      </div>
      <p className="footer-legal">
        [Advisor Name] is a licensed financial advisor with [Company Name]. This site is for
        general information only. It is not a contract of insurance and not financial advice
        tailored to your specific situation.
      </p>
    </footer>
  )
}
