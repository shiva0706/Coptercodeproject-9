import ScriptaMark from '../components/ScriptaMark';
import { Butterfly, FlowerSprig, Paperclip, FlightPath, Heart } from '../components/Doodles';

const FEATURES = [
  {
    title: 'Write once, translate everywhere',
    body: "Type or speak one idea, pick your platforms, and Scripta writes a version tuned to each one - X gets punchy and short, LinkedIn gets room to breathe, TikTok gets a hook.",
    tape: 'tape',
  },
  {
    title: 'A brand voice that remembers you',
    body: 'Teach it your tone, audience, and pet peeves once. Every post it writes afterward already sounds like you, not like a template.',
    tape: 'pine',
  },
  {
    title: 'A calendar you can actually read',
    body: 'Every platform gets its own color, every post shows its exact time, and rescheduling is a click away - no more guessing what goes out when.',
    tape: 'tape',
  },
  {
    title: 'Campaigns with a goal, not just a queue',
    body: 'Group posts around something you are actually trying to do, and watch a progress bar move instead of posting into the void.',
    tape: 'pine',
  },
  {
    title: 'Photos and clips, fitted to fit',
    body: "Upload your own media or generate an image from a prompt, and Scripta automatically crops a version for each platform's ideal shape.",
    tape: 'tape',
  },
  {
    title: 'Talk instead of type',
    body: 'Not in a typing mood? Tap the mic and speak your idea - built right into the compose page, no extra app required.',
    tape: 'pine',
  },
];

export default function Home({ onGetStarted, onSignIn }) {
  return (
    <div className="min-h-screen bg-kraft relative z-10 overflow-x-hidden">
      {/* Hero / cover page */}
      <section className="relative bg-coffee text-paper overflow-hidden">
        <div className="absolute inset-0 texture-script opacity-40" />
        <FlightPath className="absolute top-16 left-[8%] w-40 h-14 opacity-30 hidden sm:block" color="#F7F0DE" />
        <Butterfly className="absolute top-10 right-[10%] w-16 h-14 opacity-25 hidden sm:block" color="#F7F0DE" />
        <FlowerSprig className="absolute bottom-6 left-[6%] w-10 h-20 opacity-30 hidden sm:block" color="#D6A756" />

        <div className="max-w-3xl mx-auto px-6 py-20 sm:py-28 text-center relative">
          <ScriptaMark animated={false} className="w-32 h-10 mx-auto mb-4 opacity-90" />
          <h1 className="font-script text-7xl sm:text-8xl leading-none mb-4">Scripta</h1>
          <p className="font-label text-xl sm:text-2xl text-paper/85 max-w-xl mx-auto mb-10">
            the social media scrapbook that writes, schedules, and remembers your voice for you
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={onGetStarted}
              className="px-6 py-3 rounded bg-tape text-ink font-label text-lg tracking-wide hover:brightness-95 transition shadow-lg"
            >
              start my scrapbook
            </button>
            <button
              onClick={onSignIn}
              className="px-6 py-3 rounded border-2 border-paper/40 text-paper font-label text-lg tracking-wide hover:bg-paper/10 transition"
            >
              sign in
            </button>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="max-w-5xl mx-auto px-6 py-20 relative">
        <FlowerSprig className="absolute top-4 right-[2%] w-8 h-16 opacity-25 hidden lg:block" />
        <div className="text-center mb-14">
          <h2 className="font-serifDisplay font-bold text-4xl sm:text-5xl text-ink mb-3">Everything a small team needs, nothing it doesn't</h2>
          <p className="font-body text-ink/60 max-w-xl mx-auto">
            Scripta isn't a scheduling grid pretending to be a product. It's a page-by-page workspace built around how ideas actually get written.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className={`journal-page torn-edge-top rounded-b-lg px-5 pt-8 pb-5 relative ${i % 2 === 0 ? '-rotate-1' : 'rotate-1'}`}
            >
              <div className={`washi-tape ${f.tape === 'pine' ? 'washi-pine' : ''}`} />
              <h3 className="font-display text-2xl text-ink mb-2 leading-tight">{f.title}</h3>
              <p className="font-body text-sm text-ink/70 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Honest-about-limits strip, styled like a margin note rather than a legal footnote */}
      <section className="max-w-3xl mx-auto px-6 pb-16">
        <div className="journal-page torn-edge-top rounded-b-lg px-6 py-6 relative rotate-[0.4deg] texture-dots">
          <div className="washi-tape washi-pine" />
          <p className="font-label text-ink/70 text-base flex items-start gap-2">
            <Paperclip className="w-4 h-8 shrink-0 mt-0.5" />
            <span>
              A note of honesty: publishing straight to Instagram, TikTok, X, LinkedIn, Facebook, and YouTube is still simulated for now -
              real publishing needs a developer app registered with each platform. Everything else here - writing, scheduling, media fitting, campaigns - is fully real.
            </span>
          </p>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="bg-coffee text-paper py-16 relative overflow-hidden">
        <Butterfly className="absolute bottom-4 left-[4%] w-14 h-12 opacity-20 hidden sm:block" color="#F7F0DE" />
        <Heart className="absolute top-6 right-[8%] w-6 h-6 opacity-40 hidden sm:block" />
        <div className="max-w-xl mx-auto px-6 text-center relative">
          <h2 className="font-script text-5xl mb-4">Your first page is blank. Let's fix that.</h2>
          <button
            onClick={onGetStarted}
            className="px-6 py-3 rounded bg-tape text-ink font-label text-lg tracking-wide hover:brightness-95 transition shadow-lg"
          >
            start my scrapbook
          </button>
        </div>
      </section>

      <footer className="text-center py-6 text-xs font-label text-ink/40">
        Scripta — a page for every idea
      </footer>
    </div>
  );
}
