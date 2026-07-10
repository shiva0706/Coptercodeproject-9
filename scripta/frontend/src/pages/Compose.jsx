import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api';
import {
  PLATFORM_LABELS,
  PLATFORM_RATIOS,
  PLATFORM_HEX,
  ALL_PLATFORMS,
  PLATFORM_CHAR_LIMIT,
  PLATFORM_HARD_LIMIT,
  PLATFORM_TEXTAREA_ROWS,
  PLATFORM_DIMENSIONS,
} from '../platformStyles';
import { useToast } from '../components/Toast';
import { Speaker, Camera, MagnifyingGlass, LightBulb, Stack, FlowerSprig, Paperclip, EmptyFolder } from '../components/Doodles';

const ROTATIONS = ['-rotate-1', 'rotate-1.5', '-rotate-1.5', 'rotate-1'];

// The idea box isn't tied to one platform, so this is just a generous,
// generic ceiling to keep ideas as a quick prompt rather than a full draft.
const IDEA_CHAR_LIMIT = 500;

function useSpeechRecognition(onResult) {
  const recognitionRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [supported] = useState(() => typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition));

  function toggle() {
    if (!supported) return;
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (e) => {
      const transcript = Array.from(e.results).map((r) => r[0].transcript).join(' ');
      onResult(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  return { listening, supported, toggle };
}

export default function Compose({ onSaved, defaultPlatforms }) {
  const [idea, setIdea] = useState('');

  // Platform selection no longer depends on "connected accounts" - Contacts
  // is gone. Every platform is always selectable; we just default to
  // whatever the user picked back in Onboarding.
  const [selected, setSelected] = useState(defaultPlatforms?.length ? defaultPlatforms : ALL_PLATFORMS);

  // The 13 platform toggles live inside a collapsible "folder tab" drawer
  // now, rather than sitting open on the page by default. Starts closed so
  // the page reads clean; the tab itself always shows a running count plus
  // a dotted preview of what's currently picked.
  const [platformsOpen, setPlatformsOpen] = useState(false);

  const [drafts, setDrafts] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [scheduleFor, setScheduleFor] = useState({});
  const [campaigns, setCampaigns] = useState([]);
  const [campaignId, setCampaignId] = useState('');
  const [campaignFilter, setCampaignFilter] = useState('');

  const [media, setMedia] = useState(null);
  const [mediaBusy, setMediaBusy] = useState(false);
  const [mediaError, setMediaError] = useState('');
  const [fittedByPlatform, setFittedByPlatform] = useState({});
  const [fittingPlatform, setFittingPlatform] = useState(null);
  const [mediaMode, setMediaMode] = useState('upload'); // 'upload' | 'generate'
  const [imagePrompt, setImagePrompt] = useState('');
  const [chosenFileName, setChosenFileName] = useState('');
  const fileInputRef = useRef(null);

  // Optional "posting as @handle" per platform - merged in from what used
  // to be the standalone Contacts page. Purely cosmetic context now: shows
  // up in the draft preview and the simulated publish result, but never
  // blocks writing, saving, or publishing. Stored without the leading "@"
  // so it can never turn into "@@handle" - the "@" is only ever added when
  // displaying it.
  const [accountsByPlatform, setAccountsByPlatform] = useState({});
  const [handleInputs, setHandleInputs] = useState({});
  const [showHandles, setShowHandles] = useState(false);

  const ideaSpeech = useSpeechRecognition((transcript) => setIdea((cur) => (cur ? `${cur} ${transcript}` : transcript)));
  const showToast = useToast();

  // Temporary text-size control, scoped to this page only, until it moves
  // into a proper Settings page. Scales the root font-size so all the
  // rem-based Tailwind text classes on the page grow/shrink together, and
  // resets back to normal when the user navigates away.
  const [textScale, setTextScale] = useState(100);
  useEffect(() => {
    document.documentElement.style.fontSize = `${textScale}%`;
    return () => {
      document.documentElement.style.fontSize = '';
    };
  }, [textScale]);
  function bumpTextScale(delta) {
    setTextScale((cur) => Math.min(130, Math.max(85, cur + delta)));
  }

  useEffect(() => {
    api.getCampaigns().then((d) => setCampaigns(d.campaigns));
    loadAccounts();
  }, []);

  function loadAccounts() {
    api.getAccounts().then((d) => {
      const byPlatform = {};
      for (const a of d.accounts || []) byPlatform[a.platform] = a;
      setAccountsByPlatform(byPlatform);
      const inputs = {};
      for (const p of ALL_PLATFORMS) inputs[p] = byPlatform[p]?.handle || '';
      setHandleInputs(inputs);
    });
  }

  function togglePlatform(p) {
    setSelected((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));
  }

  function updateHandleInput(platform, value) {
    // Strip any leading @ the person types, so the stored/displayed value
    // never ends up doubled as "@@handle".
    const clean = value.replace(/^@+/, '');
    setHandleInputs((cur) => ({ ...cur, [platform]: clean }));
  }

  async function saveHandle(platform) {
    const raw = (handleInputs[platform] || '').trim();
    const existing = accountsByPlatform[platform];
    if (!raw) {
      if (existing) {
        await api.disconnectAccount(existing.id);
        loadAccounts();
      }
      return;
    }
    if (existing && existing.handle === raw) return; // nothing changed
    await api.connectAccount(platform, raw);
    loadAccounts();
  }

  const filteredCampaigns = useMemo(() => {
    if (!campaignFilter.trim()) return campaigns;
    const q = campaignFilter.trim().toLowerCase();
    return campaigns.filter((c) => c.name.toLowerCase().includes(q));
  }, [campaigns, campaignFilter]);

  async function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setChosenFileName(file.name);
    setMediaError('');
    setMediaBusy(true);
    setFittedByPlatform({});
    try {
      const uploaded = await api.uploadMedia(file);
      setMedia(uploaded);
    } catch (err) {
      setMediaError(err.message);
    } finally {
      setMediaBusy(false);
    }
  }

  async function handleGenerateImage() {
    if (!imagePrompt.trim()) return;
    setMediaError('');
    setMediaBusy(true);
    setFittedByPlatform({});
    try {
      const generated = await api.generateMedia(imagePrompt.trim());
      setMedia(generated);
      showToast(generated.provider === 'grok' ? 'Image generated with Grok' : 'Image generated (free)', 'success');
    } catch (err) {
      setMediaError(err.message);
    } finally {
      setMediaBusy(false);
    }
  }

  function clearMedia() {
    setMedia(null);
    setFittedByPlatform({});
    setImagePrompt('');
    setChosenFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function fitForPlatform(platform) {
    if (!media || fittedByPlatform[platform]) return;
    setFittingPlatform(platform);
    try {
      const result = await api.fitMedia(media.filename, platform, media.mimetype);
      setFittedByPlatform((cur) => ({ ...cur, [platform]: result }));
    } catch (err) {
      setMediaError(err.message);
    } finally {
      setFittingPlatform(null);
    }
  }

  async function generate(e) {
    e.preventDefault();
    setError('');
    if (!idea.trim() || selected.length === 0) return;
    setBusy(true);
    setDrafts(null);
    try {
      const d = await api.generatePosts(idea.trim(), selected);
      setDrafts(d.posts);
      if (media) {
        for (const draft of d.posts) fitForPlatform(draft.platform);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function updateDraft(platform, content) {
    setDrafts((cur) => cur.map((d) => (d.platform === platform ? { ...d, content } : d)));
  }

  function mediaFieldsFor(platform) {
    const fitted = fittedByPlatform[platform];
    if (!fitted) return {};
    return { media_path: fitted.url, media_type: fitted.mediaType };
  }

  function isOverHardLimit(platform, content) {
    const limit = PLATFORM_CHAR_LIMIT[platform];
    return !!limit && PLATFORM_HARD_LIMIT.has(platform) && content.length > limit;
  }

  async function saveDraft(platform, content) {
    if (isOverHardLimit(platform, content)) return;
    await api.createPost({ platform, content, campaign_id: campaignId || undefined, ...mediaFieldsFor(platform) });
    showToast('Saved as draft', 'success');
    onSaved();
  }

  async function schedule(platform, content) {
    if (isOverHardLimit(platform, content)) return;
    const when = scheduleFor[platform];
    if (!when) return;
    await api.createPost({
      platform,
      content,
      scheduled_at: new Date(when).toISOString(),
      campaign_id: campaignId || undefined,
      ...mediaFieldsFor(platform),
    });
    showToast('Scheduled', 'success');
    onSaved();
  }

  return (
    <div className="max-w-5xl font-body">
      <h1 className="font-display text-4xl text-ink mb-1">New page</h1>
      <p className="font-label text-ink/50 text-base mb-3">jot the idea once, we'll write it in for every platform you pick</p>

      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm font-label text-ink/50">text size</span>
        <button
          type="button"
          onClick={() => bumpTextScale(-10)}
          disabled={textScale <= 85}
          aria-label="decrease text size"
          className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-line text-ink/70 text-sm font-bold hover:border-scripta/50 disabled:opacity-30 transition"
        >
          A-
        </button>
        <button
          type="button"
          onClick={() => setTextScale(100)}
          aria-label="reset text size"
          className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-line text-ink/70 text-base font-bold hover:border-scripta/50 transition"
        >
          A
        </button>
        <button
          type="button"
          onClick={() => bumpTextScale(10)}
          disabled={textScale >= 130}
          aria-label="increase text size"
          className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-line text-ink/70 text-lg font-bold hover:border-scripta/50 disabled:opacity-30 transition"
        >
          A+
        </button>
        <span className="text-sm font-label text-ink/30">(a proper Settings page for this is coming)</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-8 items-start">
        <div>
          <form onSubmit={generate} className="journal-page torn-edge-top rounded-b-lg px-6 pt-8 pb-6 mb-10 relative rotate-[-0.4deg] space-y-5">
            <div className="washi-tape washi-pine" />

            {/* --- Destinations folder tab ------------------------------ */}
            <div>
              <button
                type="button"
                onClick={() => setPlatformsOpen((cur) => !cur)}
                aria-expanded={platformsOpen}
                className={`group relative inline-flex items-center gap-2 pl-4 pr-3.5 pt-2 pb-2.5 -mb-px -rotate-1 border-2 border-line font-label text-base text-ink/80 transition ${
                  platformsOpen ? 'bg-white/80 border-b-white/80' : 'bg-tape/50 hover:bg-tape/70'
                }`}
                style={{
                  clipPath: 'polygon(6% 0, 94% 0, 100% 35%, 100% 100%, 0 100%, 0 35%)',
                  borderTopLeftRadius: '0.6rem',
                  borderTopRightRadius: '0.6rem',
                }}
              >
                <Stack className="w-4 h-4 shrink-0" color="#2A2118" />
                <span className="font-semibold tracking-wide">destinations</span>
                <span className="text-sm font-mono text-ink/40">({selected.length})</span>
                <span
                  className={`inline-block text-ink/50 text-sm transition-transform duration-200 ${platformsOpen ? '-rotate-180' : ''}`}
                  aria-hidden="true"
                >
                  &#9662;
                </span>
              </button>

              {/* Closed-state preview: a dotted strip of the platforms
                  already picked, so nothing feels hidden - just tucked away. */}
              {!platformsOpen && (
                <div className="border-2 border-line rounded-b-lg rounded-tr-lg bg-white/40 px-3 py-2 flex items-center flex-wrap gap-1.5">
                  {selected.length === 0 ? (
                    <span className="text-sm font-label text-ink/35">nothing picked yet - open the tab above</span>
                  ) : (
                    selected.map((p) => (
                      <span
                        key={p}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-label"
                        style={{ backgroundColor: `${PLATFORM_HEX[p]}15`, color: PLATFORM_HEX[p] }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: PLATFORM_HEX[p] }} />
                        {PLATFORM_LABELS[p]}
                      </span>
                    ))
                  )}
                </div>
              )}

              {/* Open-state drawer */}
              <div
                className={`grid transition-all duration-300 ease-out ${
                  platformsOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="overflow-hidden">
                  <div className="border-2 border-line rounded-b-lg rounded-tr-lg bg-white/70 p-4 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {ALL_PLATFORMS.map((p) => {
                        const isOn = selected.includes(p);
                        return (
                          <button
                            type="button"
                            key={p}
                            onClick={() => togglePlatform(p)}
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-base font-label border-2 transition ${
                              isOn ? 'text-paper border-transparent font-medium' : 'font-semibold border-line hover:border-scripta/50'
                            }`}
                            style={
                              isOn
                                ? { backgroundColor: PLATFORM_HEX[p] }
                                : { backgroundColor: `${PLATFORM_HEX[p]}0D`, color: PLATFORM_HEX[p] }
                            }
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: isOn ? 'rgba(255,255,255,0.8)' : PLATFORM_HEX[p] }}
                            />
                            {PLATFORM_LABELS[p]}
                          </button>
                        );
                      })}
                    </div>

                    {selected.length > 0 && (
                      <div>
                        <button
                          type="button"
                          onClick={() => setShowHandles((cur) => !cur)}
                          className="text-sm font-label text-ink/50 hover:text-scripta underline decoration-dotted"
                        >
                          {showHandles ? 'hide' : '+ add handles'} <span className="text-ink/35">(optional)</span>
                        </button>
                        {showHandles && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {selected.map((p) => (
                              <div key={p} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-line bg-white/60">
                                <span
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: PLATFORM_HEX[p] }}
                                />
                                <span className="text-sm font-label text-ink/50">{PLATFORM_LABELS[p]}</span>
                                <span className="text-sm font-mono text-ink/40">@</span>
                                <input
                                  value={handleInputs[p] || ''}
                                  onChange={(e) => updateHandleInput(p, e.target.value)}
                                  onBlur={() => saveHandle(p)}
                                  placeholder="yourhandle"
                                  className="w-24 text-sm font-mono bg-transparent outline-none placeholder:text-ink/30"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* --- /Destinations folder tab ----------------------------- */}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-base font-label text-ink/70">
                  what's the idea?
                </label>
                {ideaSpeech.supported && (
                  <button
                    type="button"
                    onClick={() => ideaSpeech.toggle()}
                    title={ideaSpeech.listening ? 'listening…' : 'speak it'}
                    className={`flex items-center justify-center w-9 h-9 rounded-full border-2 transition ${
                      ideaSpeech.listening ? 'bg-clay/20 border-clay animate-pulse' : 'border-line hover:border-scripta/50'
                    }`}
                  >
                    <Speaker className="w-4 h-4" color={ideaSpeech.listening ? '#8C3A3A' : '#2A2118'} />
                  </button>
                )}
              </div>
              <textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="e.g. We just launched free shipping on orders over $50"
                rows={4}
                maxLength={IDEA_CHAR_LIMIT}
                className="w-full px-4 py-3 rounded-lg border-2 border-line bg-white/70 focus:bg-white transition text-base leading-relaxed"
              />
              <p className={`text-sm font-mono text-right mt-1 ${idea.length >= IDEA_CHAR_LIMIT ? 'text-clay font-bold' : 'text-ink/40'}`}>
                {idea.length}/{IDEA_CHAR_LIMIT}
              </p>
            </div>

            {campaigns.length > 0 && (
              <div>
                <label className="block text-base font-label text-ink/70 mb-1">part of a campaign?</label>
                {campaigns.length > 5 && (
                  <div className="relative mb-1.5">
                    <MagnifyingGlass className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" color="#8A8477" />
                    <input
                      value={campaignFilter}
                      onChange={(e) => setCampaignFilter(e.target.value)}
                      placeholder="search campaigns…"
                      className="w-full pl-9 pr-3 py-2 rounded border-2 border-line bg-white/70 focus:bg-white transition text-base"
                    />
                  </div>
                )}
                <select
                  value={campaignId}
                  onChange={(e) => setCampaignId(e.target.value)}
                  className="w-full px-3 py-2 rounded border-2 border-line bg-white/70 text-base"
                >
                  <option value="">not part of one</option>
                  {filteredCampaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="flex items-center gap-2 text-base font-label text-ink/70 mb-2">
                <Camera className="w-5 h-4 shrink-0" color="#2A2118" />
                photo or clip (optional)
              </label>
              {!media ? (
                <div>
                  <div className="flex gap-1.5 mb-2 text-sm font-label">
                    <button
                      type="button"
                      onClick={() => setMediaMode('upload')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 transition ${mediaMode === 'upload' ? 'bg-ink text-paper border-ink' : 'border-line text-ink/60 hover:border-ink/40'}`}
                    >
                      <Camera className="w-4 h-3.5" color={mediaMode === 'upload' ? '#F7F0DE' : '#2A2118'} />
                      upload my own
                    </button>
                    <button
                      type="button"
                      onClick={() => setMediaMode('generate')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 transition ${mediaMode === 'generate' ? 'bg-ink text-paper border-ink' : 'border-line text-ink/60 hover:border-ink/40'}`}
                    >
                      <LightBulb className="w-[18px] h-[21px]" />
                      generate with AI
                    </button>
                  </div>

                  {mediaMode === 'upload' ? (
                    <div className="flex items-center gap-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="compose-file-input"
                      />
                      <label
                        htmlFor="compose-file-input"
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full border-2 border-line bg-white/60 hover:bg-white hover:border-scripta/50 transition text-sm font-label text-ink/70 cursor-pointer"
                      >
                        <EmptyFolder className="w-5 h-4 shrink-0" color={chosenFileName ? '#3F6659' : '#8A8477'} />
                        {chosenFileName || 'choose a file'}
                      </label>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        value={imagePrompt}
                        onChange={(e) => setImagePrompt(e.target.value)}
                        placeholder="describe the image, e.g. cozy coffee shop, warm morning light"
                        className="flex-1 px-3 py-2 rounded border-2 border-line bg-white/70 focus:bg-white transition text-base"
                      />
                      <button
                        type="button"
                        onClick={handleGenerateImage}
                        disabled={mediaBusy || !imagePrompt.trim()}
                        className="px-3 py-2 rounded bg-scripta text-paper text-sm font-label hover:bg-scriptaDeep transition disabled:opacity-40 shrink-0"
                      >
                        {mediaBusy ? 'painting…' : 'generate'}
                      </button>
                    </div>
                  )}
                  {mediaBusy && mediaMode === 'upload' && <p className="text-sm text-ink/40 font-label mt-1">uploading…</p>}
                  {mediaError && <p className="text-sm text-clay font-label mt-1">{mediaError}</p>}
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  <div className="polaroid w-36 -rotate-2">
                    {media.mediaType === 'video' ? (
                      <video src={media.originalUrl} className="h-28 w-full object-cover" />
                    ) : (
                      <img src={media.originalUrl} alt="" className="h-28 w-full object-cover" />
                    )}
                  </div>
                  <div className="text-sm font-label text-ink/60">
                    <p className="mb-1.5 leading-relaxed">
                      attached{media.provider === 'grok' ? ' — generated with Grok' : media.provider === 'pollinations' ? ' — generated free' : ''}
                      , we'll auto-crop a copy for each platform below
                    </p>
                    <button type="button" onClick={clearMedia} className="text-clay hover:underline font-bold">remove</button>
                  </div>
                </div>
              )}
            </div>

            {error && <p className="text-clay text-base font-label">{error}</p>}
            <button
              type="submit"
              disabled={busy || selected.length === 0}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3 rounded-lg bg-scripta text-paper text-lg font-label font-bold tracking-wide hover:bg-scriptaDeep transition disabled:opacity-50"
            >
              <LightBulb className="w-5 h-6 shrink-0" />
              {busy ? 'writing…' : `write my post${selected.length > 1 ? 's' : ''}`}
            </button>
          </form>

          {drafts && (
            <div className="space-y-8">
              <h2 className="font-display text-3xl text-ink">Review & paste in</h2>
              {drafts.map((d, i) => {
                const fitted = fittedByPlatform[d.platform];
                const limit = PLATFORM_CHAR_LIMIT[d.platform];
                const isHard = PLATFORM_HARD_LIMIT.has(d.platform);
                const len = d.content.length;
                const overLimit = !!limit && len > limit;
                const nearLimit = !!limit && !overLimit && len > limit * 0.9;
                const blocked = isHard && overLimit;
                const dims = PLATFORM_DIMENSIONS[d.platform];
                const handle = accountsByPlatform[d.platform]?.handle;

                return (
                  <div key={d.platform} className={`journal-page torn-edge-top rounded-b-lg px-5 pt-7 pb-5 relative ${ROTATIONS[i % ROTATIONS.length]} space-y-2`}>
                    <div className={`washi-tape ${i % 2 === 0 ? '' : 'washi-pine'}`} />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PLATFORM_HEX[d.platform] }} />
                        <div className="ink-stamp inline-block px-2 py-0.5 text-base font-label uppercase tracking-wide text-scripta -rotate-2">
                          {PLATFORM_LABELS[d.platform] || d.platform}
                        </div>
                        {handle && <span className="text-sm font-mono text-ink/40">as @{handle}</span>}
                      </div>
                      {media && (
                        <span className="text-sm text-ink/40 font-mono">
                          {PLATFORM_RATIOS[d.platform]}{dims ? ` · ${dims.width}×${dims.height}` : ''}
                        </span>
                      )}
                    </div>

                    {media && (
                      <div className="pt-1">
                        {fittingPlatform === d.platform && <p className="text-sm text-ink/40 font-label">fitting to {PLATFORM_RATIOS[d.platform]}…</p>}
                        {fitted && (
                          <div className="polaroid w-44 -rotate-1">
                            {fitted.mediaType === 'video' ? (
                              <video src={fitted.url} controls className="max-h-44 w-full" />
                            ) : (
                              <img src={fitted.url} alt="" className="max-h-44 w-full" />
                            )}
                          </div>
                        )}
                        {!fitted && fittingPlatform !== d.platform && (
                          <button type="button" onClick={() => fitForPlatform(d.platform)} className="text-sm text-scripta hover:underline font-label">
                            crop photo to fit {PLATFORM_LABELS[d.platform]}
                          </button>
                        )}
                      </div>
                    )}

                    <textarea
                      value={d.content}
                      onChange={(e) => updateDraft(d.platform, e.target.value)}
                      rows={PLATFORM_TEXTAREA_ROWS[d.platform] || 4}
                      className={`w-full px-3 py-2 rounded border-2 bg-white/80 text-base ${blocked ? 'border-clay' : 'border-line'}`}
                    />
                    <div className="flex items-center justify-between">
                      {blocked ? (
                        <p className="text-sm font-label text-clay">over the limit — {PLATFORM_LABELS[d.platform]} will cut this off or reject it</p>
                      ) : <span />}
                      <p className={`text-sm font-mono ${blocked ? 'text-clay font-bold' : nearLimit ? 'text-tape font-bold' : 'text-ink/40'}`}>
                        {limit ? `${len}/${limit}` : `${len} chars`}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        onClick={() => saveDraft(d.platform, d.content)}
                        disabled={blocked}
                        className="px-3 py-1.5 rounded bg-ink text-paper text-sm font-label hover:bg-ink/80 transition disabled:opacity-40"
                      >
                        save as draft
                      </button>
                      <input
                        type="datetime-local"
                        value={scheduleFor[d.platform] || ''}
                        onChange={(e) => setScheduleFor({ ...scheduleFor, [d.platform]: e.target.value })}
                        className="px-2 py-1.5 rounded border-2 border-line bg-white/80 text-sm font-mono"
                      />
                      <button
                        onClick={() => schedule(d.platform, d.content)}
                        disabled={!scheduleFor[d.platform] || blocked}
                        className="px-3 py-1.5 rounded bg-scripta text-paper text-sm font-label hover:bg-scriptaDeep transition disabled:opacity-40"
                      >
                        schedule
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Side panel - fills what used to be empty background space with a
            few quick tips and matching hand-drawn doodles. */}
        <aside className="hidden lg:block sticky top-24 space-y-6">
          <div className="journal-page torn-edge-top rounded-b-lg px-5 pt-7 pb-6 relative rotate-[0.6deg]">
            <div className="washi-tape" />
            <Paperclip className="w-4 h-8 absolute -right-2 top-6 opacity-50" />
            <h3 className="font-display text-2xl text-ink mb-3">quick tips</h3>
            <ul className="space-y-3 text-base font-body text-ink/70 leading-relaxed">
              <li className="flex gap-2">
                <Speaker className="w-4 h-4 shrink-0 mt-0.5" color="#3F6659" />
                tap the mic and just talk through your idea — it'll type it out for you.
              </li>
              <li className="flex gap-2">
                <LightBulb className="w-4 h-[19px] shrink-0 mt-0.5" />
                no photo handy? generate one from a short description.
              </li>
              <li className="flex gap-2">
                <Stack className="w-5 h-4 shrink-0 mt-0.5" color="#3F6659" />
                open the destinations tab to pick every platform you want up front — one idea, written for all of them at once.
              </li>
            </ul>
          </div>
          <FlowerSprig className="w-10 h-16 mx-auto opacity-60" />
        </aside>
      </div>
    </div>
  );
}