import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Clock,
  Award,
  MapPin,
  ShieldCheck,
  HeartHandshake,
  Ruler,
  LifeBuoy,
  MessageSquareText,
  HeartPulse,
  Coins,
  PiggyBank,
  MessageCircle,
  Target,
  Compass,
  Handshake,
  CheckCircle2,
} from 'lucide-react'
import { AutoCarousel } from './Carousel.jsx'
import { Reveal } from './Reveal.jsx'
import { IconTile } from './IconTile.jsx'
import { Header } from './Header.jsx'
import { Footer } from './Footer.jsx'

export default function App() {
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    // One short, deliberate pause before the page settles in —
    // not an instant mount. Respects prefers-reduced-motion via CSS.
    const timer = setTimeout(() => setRevealed(true), 700)
    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      <div className={`loader${revealed ? ' is-exiting' : ''}`} aria-hidden="true">
        <div className="loader-mark">F</div>
      </div>

      <div className={`page${revealed ? ' is-revealed' : ''}`}>
        <div className="top-ribbon" aria-hidden="true" />
        <Header />
        <Hero />
        <TrustStrip />
        <Achievements />
        <Story />
        <WhyChoose />
        <ProblemCascade />
        <Process />
        <Services />
        <Quote />
        <WhyWork />
        <Testimonials />
        <FAQ />
        <FinalCTA />
        <Footer />
      </div>
    </>
  )
}

function Hero() {
  return (
    <section id="top" className="section hero">
      <div className="hero-copy">
        <span className="eyebrow reveal reveal-1">Financial advisory, one honest conversation at a time</span>
        <h1 className="hero-title reveal reveal-2">Plans built around your life, not a sales quota.</h1>
        <p className="hero-sub reveal reveal-3">
          I'm [Advisor Name], an independent financial advisor. I help individuals and families
          protect their income, their health, and the goals they're working toward — with honest
          numbers and no pressure to decide today.
        </p>
        <div className="hero-ctas reveal reveal-4">
          <Link to="/book-consultation" className="btn btn-primary">Book a free consultation</Link>
          <a href="tel:[PHONE PLACEHOLDER]" className="btn btn-ghost">Call [Phone Placeholder]</a>
        </div>
      </div>
      <div className="hero-media reveal reveal-5">
        <img
          className="test-photo hero-photo"
          src="/test-photo.jpg"
          alt="Test placeholder — swap for the advisor's real photo"
        />
      </div>
    </section>
  )
}

const TRUST_ITEMS = [
  { icon: Clock, text: '[X]+ years guiding families through financial decisions' },
  { icon: Award, text: '[Award or recognition placeholder]' },
  { icon: MapPin, text: 'Serving [region placeholder] — online and in person' },
  { icon: ShieldCheck, text: 'Licensed, independent, obligation-free consultations' },
]

function TrustStrip() {
  return (
    <section className="trust-strip">
      <div className="trust-grid">
        {TRUST_ITEMS.map((item, i) => (
          <div className="trust-item" key={i}>
            <IconTile icon={item.icon} tone="dark" size={18} />
            <span>{item.text}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

const ACHIEVEMENTS = [
  { title: '7-time Medallion Awardee', body: 'Recognized for consistent service, year over year.' },
  { title: 'Grand Slam Awardee, 2024', body: 'Advisor-level recognition for outstanding performance.' },
  { title: "President's Club recognition", body: 'Honored among top-performing advisors company-wide.' },
  { title: 'Monthly Champions Awardee', body: 'Recognized for consistent monthly results.' },
  { title: 'Top Advisor recognition', body: "Ranked among the agency's leading advisors." },
  { title: 'Team recognition award', body: 'Celebrated alongside colleagues for collective results.' },
  { title: 'Hall of Fame Qualifier', body: 'Reached career-milestone status within the agency.' },
  { title: 'Client Retention Award', body: 'Recognized for keeping client relationships strong year after year.' },
  { title: 'New Business Leader, Q2 2025', body: 'Top new-business producer in the branch for the quarter.' },
]

function Achievements() {
  return (
    <section id="achievements" className="section achievements section-wash">
      <h2 className="section-heading" style={{ marginBottom: '8px' }}>Recognition along the way</h2>
      <p className="achievements-note">
        These mark consistency, not the point of the work — that's still your family's peace of mind.
      </p>
      <AutoCarousel
        items={ACHIEVEMENTS}
        ariaLabel="Awards and recognition"
        speed={38}
        renderItem={(item) => (
          <div className="achievement-card">
            <img
              className="achievement-photo test-photo"
              src="/test-photo-award.jpg"
              alt="Test placeholder — swap for the award or recognition photo"
            />
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </div>
        )}
      />
    </section>
  )
}

function Story() {
  return (
    <section id="about" className="section story">
      <div className="story-media">
        <img
          className="test-photo story-photo"
          src="/test-photo-story.jpg"
          alt="Test placeholder — swap for the advisor-at-work photo"
        />
      </div>
      <div className="story-copy">
        <h2>Why I do this work</h2>
        <p>
          Early in my career, I watched a family absorb a medical emergency with no safety net.
          The savings went first, then the retirement fund, then the plans they'd spent a decade
          building. That's the moment I decided to do this work differently.
        </p>
        <p>
          If I were making this decision for my own family, what would I want to know? That
          question still guides every conversation I have. Financial planning should start with
          listening and understanding — never with selling.
        </p>
      </div>
    </section>
  )
}

const CHOICE_FEATURES = [
  { icon: HeartHandshake, title: 'No sales pressure', body: 'You leave the first conversation with clarity, whether or not you decide to move forward.' },
  { icon: Ruler, title: 'Plans sized to your life', body: 'Your coverage is built around your budget and your priorities, not a template.' },
  { icon: LifeBuoy, title: "Support that doesn't end at signing", body: "I'm here for reviews, questions, and claims long after the paperwork is done." },
  { icon: MessageSquareText, title: 'Plain-language explanations', body: "You'll understand exactly what you own and why, before you sign anything." },
]

function WhyChoose() {
  return (
    <section className="section section-tight">
      <h2 className="section-heading">Why clients choose to work with me</h2>
      <div className="feature-grid">
        {CHOICE_FEATURES.map((f, i) => (
          <Reveal as="div" className="feature-card" delay={i * 80} key={f.title}>
            <IconTile icon={f.icon} />
            <h3>{f.title}</h3>
            <p>{f.body}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

const CASCADE = [
  { n: 1, title: 'The income stops', body: 'Salary, business income, or support stops arriving the same week expenses grow.' },
  { n: 2, title: 'Savings absorb it first', body: 'The emergency fund goes, then the fund set aside for school or retirement.' },
  { n: 3, title: 'Borrowing fills the gap', body: 'Interest tends to outrun recovery, and the debt can outlive the original setback.' },
  { n: 4, title: 'Long-term goals get shelved', body: 'No one announces it. The house, the tuition, the retirement simply stop being possible.' },
]

function ProblemCascade() {
  return (
    <section className="section problem">
      <div className="problem-intro">
        <h2>What one setback can undo</h2>
        <p>
          Most families are one hospital admission or one lost income away from a hole they never
          budgeted for. The bill is rarely the hardest part. What follows it is.
        </p>
      </div>
      <div className="problem-grid">
        {CASCADE.map((item, i) => (
          <Reveal as="div" className="problem-item" delay={i * 90} key={item.n}>
            <span className="problem-num">{item.n}</span>
            <div>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

const STEPS = [
  { n: 1, title: 'Book a free consultation', body: 'We find a time that suits you, online or in person. Bring every question, including the ones that feel too simple to ask.' },
  { n: 2, title: 'We look at your real situation', body: 'What you earn, who depends on you, and what your employer or existing coverage already handles — in plain language.' },
  { n: 3, title: 'You decide, in your own time', body: "If a plan fits, I size it to your budget. If nothing fits yet, I'll tell you that too, and you leave with a clearer head." },
]

function Process() {
  return (
    <section id="process" className="section">
      <div className="process-intro">
        <h2 className="section-heading" style={{ marginBottom: '12px' }}>How we get started</h2>
        <p>Three unhurried steps. Nothing is decided until you're ready.</p>
      </div>
      <div className="process-grid">
        {STEPS.map((step, i) => (
          <Reveal delay={i * 100} key={step.n}>
            <span className="step-badge">{step.n}</span>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

const SERVICES = [
  { icon: ShieldCheck, title: 'Income protection', body: 'Coverage that keeps your household running if your income is interrupted.' },
  { icon: HeartPulse, title: 'Critical illness coverage', body: "A payout you can use for treatment or recovery, so illness doesn't have to be funded by selling something." },
  { icon: Coins, title: 'Investment-linked life insurance', body: 'Protection and growth working together, pointed at a goal you can actually name.' },
  { icon: PiggyBank, title: 'Retirement planning', body: 'A dependable income stream for the years when a paycheck no longer arrives.' },
]

function Services() {
  return (
    <section id="services" className="section services">
      <div className="services-intro">
        <h2 className="section-heading" style={{ marginBottom: '12px' }}>Ways I can help</h2>
        <p>Every plan below is a starting point, not a fixed package. Which one fits depends on your goals, worked out together.</p>
      </div>
      <div className="service-grid">
        {SERVICES.map((s, i) => (
          <Reveal as="div" className="service-card" delay={i * 80} key={s.title}>
            <IconTile icon={s.icon} tone="dark" />
            <h3>{s.title}</h3>
            <p>{s.body}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

function Quote() {
  return (
    <section className="section quote-section">
      <blockquote>
        "My goal isn't to sell a policy. It's to help you sleep better at night, knowing the
        people you love are protected."
      </blockquote>
      <p className="quote-attr">— [Advisor Name]</p>
    </section>
  )
}

const WHY_WORK = [
  { icon: MessageCircle, title: 'Client-first conversations', body: "We begin with your life and goals, never with a product I'm trying to sell." },
  { icon: Target, title: 'Plans sized to your goals', body: 'Your plan fits your budget and priorities, not a one-size template.' },
  { icon: Compass, title: 'Clear, pressure-free guidance', body: 'Honest answers and all the time you need to decide.' },
  { icon: Handshake, title: 'A relationship, not a transaction', body: "I'm here after the paperwork too, for reviews, questions, and claims." },
  { icon: CheckCircle2, title: 'Full understanding before you sign', body: "You'll know exactly what you own and why." },
]

function WhyWork() {
  return (
    <section className="section section-tight section-wash">
      <h2 className="section-heading">The kind of guidance that stays with you</h2>
      <div className="why-grid">
        {WHY_WORK.map((w, i) => (
          <Reveal delay={i * 70} key={w.title}>
            <IconTile icon={w.icon} />
            <h3>{w.title}</h3>
            <p>{w.body}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

const TESTIMONIALS = [
  {
    quote: '[Testimonial placeholder — ask a client for a short quote about their experience with you.]',
    who: '[Client descriptor placeholder]',
  },
  {
    quote: '[Testimonial placeholder — ask a client for a short quote about their experience with you.]',
    who: '[Client descriptor placeholder]',
  },
  {
    quote: '[Testimonial placeholder — ask a client for a short quote about their experience with you.]',
    who: '[Client descriptor placeholder]',
  },
  {
    quote: '[Testimonial placeholder — ask a client for a short quote about their experience with you.]',
    who: '[Client descriptor placeholder]',
  },
  {
    quote: '[Testimonial placeholder — ask a client for a short quote about their experience with you.]',
    who: '[Client descriptor placeholder]',
  },
  {
    quote: '[Testimonial placeholder — ask a client for a short quote about their experience with you.]',
    who: '[Client descriptor placeholder]',
  },
]

function Testimonials() {
  return (
    <section id="testimonials" className="section testimonials">
      <h2 className="section-heading" style={{ marginBottom: '8px' }}>What clients say</h2>
      <p className="testimonials-note">[Replace with real, permissioned client quotes before this goes live.]</p>
      <div className="testimonial-grid">
        {TESTIMONIALS.map((item, i) => (
          <Reveal as="div" className="testimonial-card" delay={i * 80} key={item.who + i}>
            <p>"{item.quote}"</p>
            <p>{item.who}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

const FAQS = [
  {
    q: "Is insurance just money I'll never see again?",
    a: "It depends on the plan. Pure protection is a cost, like car insurance — the cheapest way to cover a large risk. Other plans build value you can use while you're alive, and some pay out for critical illness long before anything else. In our first conversation I'll show you which one your situation actually calls for.",
  },
  {
    q: 'How much will this cost me each month?',
    a: "There's no single figure — a good plan is sized to your income and to who depends on you, not to a price list. Bring the amount you're comfortable setting aside, and we'll work backward from what you can carry for years without resenting it.",
  },
  {
    q: 'I already have coverage through work. Is that enough?',
    a: "It's a real benefit and worth understanding — it's also tied to your job. If you resign, get laid off, or retire, it usually ends with your last paycheck. We'll look at exactly what your coverage includes, then decide together whether you need anything of your own on top.",
  },
  {
    q: 'Am I too young, or is it too late for me?',
    a: "If you're earning and someone depends on you, it's the right time. What changes with age isn't whether you can start, but what it costs and what you'll qualify for — which is exactly why starting while you're healthy matters.",
  },
  {
    q: "What if I'm not ready to buy anything?",
    a: "Then you don't buy anything. Plenty of people leave our first conversation with a clearer plan, a list of what to sort out first, and no policy at all — that's a good outcome.",
  },
  {
    q: 'Do we have to meet in person?',
    a: "Only if you'd like to. I meet clients in person across [region placeholder], and I work with families anywhere through video calls at a time that fits your schedule.",
  },
]

function FAQ() {
  return (
    <section id="faq" className="section">
      <h2 className="section-heading">Questions people are often too polite to ask</h2>
      <div className="faq-list">
        {FAQS.map((item) => (
          <details key={item.q}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

function FinalCTA() {
  return (
    <section id="contact" className="section final-cta">
      <h2>Let's start with a conversation</h2>
      <p>Every plan starts with one unhurried conversation. There's no pressure, and no obligation to continue.</p>
      <Link to="/book-consultation" className="btn btn-primary">Book a free consultation</Link>
      <div className="contact-row">
        <span>[Phone placeholder]</span>
        <span>[Email placeholder]</span>
        <span>[City, region placeholder]</span>
      </div>
    </section>
  )
}


