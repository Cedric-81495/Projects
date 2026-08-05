import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <section className="sec t-0" style={{ minHeight: '70vh', display: 'grid', placeItems: 'center', textAlign: 'center' }}>
      <div className="wrap">
        <p className="chip-num" style={{ fontSize: '4rem' }}>404</p>
        <h2 className="h2">This chapter isn&apos;t written</h2>
        <p className="body" style={{ margin: '0 auto 24px' }}>The page you were looking for moved, or never existed.</p>
        <Link className="btn btn--gold" to="/">Back to the movement</Link>
      </div>
    </section>
  );
}
