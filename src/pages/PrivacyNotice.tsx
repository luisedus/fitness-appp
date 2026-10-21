import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import notice from '@/content/privacy-notice.txt?raw';

const [title, ...lines] = notice.trim().split('\n');

export default function PrivacyNotice() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <Link to="/" className="font-display text-2xl">GYMBRO<span className="text-primary">'S</span></Link>
          <Button asChild variant="outline" size="sm">
            <Link to="/"><ArrowLeft aria-hidden="true" /> Volver al inicio</Link>
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
        <h1 className="mb-8 break-words text-3xl leading-tight tracking-normal sm:text-4xl">{title}</h1>
        <article className="space-y-5 break-words text-sm leading-7 text-secondary-foreground sm:text-base">
          {lines.join('\n').trim().split(/\n\s*\n/).map((paragraph, index) => {
            const [heading, ...body] = paragraph.split('\n');
            if (/^\d+\.- /.test(heading)) {
              return (
                <section key={index}>
                  <h2 className="mb-3 text-2xl tracking-normal text-primary">{heading}</h2>
                  <p className="whitespace-pre-line">{body.join('\n')}</p>
                </section>
              );
            }
            return <p key={index} className="whitespace-pre-line">{paragraph}</p>;
          })}
        </article>
      </main>
    </div>
  );
}