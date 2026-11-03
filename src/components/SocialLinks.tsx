const WHATSAPP = 'https://wa.me/523349666366?text=' + encodeURIComponent('Hola GYMBRO\'S, quiero información');
const MAPS_URL = 'https://www.google.com.mx/maps/place/GYM+Fitness/@21.8542129,-102.3334942,17z/data=!3m1!4b1!4m6!3m5!1s0x8429ec104011cba9:0x2b25416851256757!8m2!3d21.8542129!4d-102.3334942';
const MAPS_EMBED = 'https://www.google.com/maps?q=21.8542129,-102.3334942&z=16&output=embed';

const links = [
  { label: 'Facebook', href: 'https://www.facebook.com/', icon: 'f' },
  { label: 'Instagram', href: 'https://www.instagram.com/', icon: '◎' },
  { label: 'WhatsApp', href: WHATSAPP, icon: '✆' },
  { label: 'Ubicación', href: MAPS_URL, icon: '⌖' },
];

export function SocialLinks() {
  return (
    <footer style={{ background: 'hsl(var(--carbon))', borderTop: '1px solid hsl(var(--border))', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gap: '1.5rem' }}>
        <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.6rem', letterSpacing: '0.06em', textAlign: 'center' }}>
          <span style={{ color: 'hsl(var(--foreground))' }}>CONTACTA A </span>
          <span style={{ color: 'hsl(var(--neon))' }}>GYMBRO'S</span>
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
          {links.map((l) => (
            <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className="btn-ghost"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
              <span style={{ color: 'hsl(var(--neon))', fontWeight: 700 }}>{l.icon}</span>{l.label}
            </a>
          ))}
        </div>
        <iframe title="Ubicación GYM Fitness" src={MAPS_EMBED} loading="lazy"
          style={{ width: '100%', height: 260, border: 0, borderRadius: '1rem' }} />
      </div>
    </footer>
  );
}
