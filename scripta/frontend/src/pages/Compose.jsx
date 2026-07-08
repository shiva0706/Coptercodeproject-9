import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { PLATFORM_LABELS, PLATFORM_RATIOS } from '../platformStyles';
import { useToast } from '../components/Toast';

const ALL_PLATFORMS = ['instagram', 'tiktok', 'x', 'linkedin', 'facebook', 'youtube'];
const ROTATIONS = ['-rotate-1', 'rotate-1.5', '-rotate-1.5', 'rotate-1'];

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

export default function Compose({ onSaved }) {
  const [idea, setIdea] = useState('');
  const [selected, setSelected] = useState(['instagram', 'x', 'linkedin']);
  const [drafts, setDrafts] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [scheduleFor, setScheduleFor] = useState({});
  const [campaigns, setCampaigns] = useState([]);
  const [campaignId, setCampaignId] = useState('');

  const [media, setMedia] = useState(null);
  const [mediaBusy, setMediaBusy] = useState(false);
  const [mediaError, setMediaError] = useState('');
  const [fittedByPlatform, setFittedByPlatform] = useState({});
  const [fittingPlatform, setFittingPlatform] = useState(null);
  const [mediaMode, setMediaMode] = useState('upload'); // 'upload' | 'generate'
  const [imagePrompt, setImagePrompt] = useState('');
  const fileInputRef = useRef(null);

  const ideaSpeech = useSpeechRecognition((transcript) => setIdea((cur) => (cur ? `${cur} ${transcript}` : transcript)));
  const showToast = useToast();

  useEffect(() => {
    api.getCampaigns().then((d) => setCampaigns(d.campaigns));
  }, []);

  function togglePlatform(p) {
    setSelected((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));
  }

  async function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
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

  async function saveDraft(platform, content) {
    await api.createPost({ platform, content, campaign_id: campaignId || undefined, ...mediaFieldsFor(platform) });
    showToast('Saved as draft', 'success');
    onSaved();
  }

  async function schedule(platform, content) {
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
    <div className="max-w-2xl font-body">
      <h1 className="font-display text-4xl text-ink mb-1">New page</h1>
      <p className="font-label text-ink/50 text-base mb-6">jot the idea once, we'll write it in for every platform</p>

      <form onSubmit={generate} className="journal-page torn-edge-top rounded-b-lg px-6 pt-8 pb-6 mb-10 relative rotate-[-0.4deg] space-y-4">
        <div className="washi-tape washi-pine" />
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-label text-ink/70">what's the idea?</label>
            {ideaSpeech.supported && (
              <button
                type="button"
                onClick={() => ideaSpeech.toggle()}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-label border-2 transition ${
                  ideaSpeech.listening ? 'bg-clay text-paper border-clay animate-pulse' : 'border-line text-ink/60 hover:border-scripta/50'
                }`}
              >
                🎙️ {ideaSpeech.listening ? 'listening…' : 'speak it'}
              </button>
            )}
          </div>
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="e.g. We just launched free shipping on orders over $50"
            rows={3}
            className="w-full px-3 py-2 rounded border-2 border-line bg-white/70 focus:bg-white transition text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-label text-ink/70 mb-2">which platforms?</label>
          <div className="flex flex-wrap gap-2">
            {ALL_PLATFORMS.map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => togglePlatform(p)}
                className={`px-3 py-1 rounded-full text-xs font-label transition border-2 ${
                  selected.includes(p)
                    ? 'bg-scripta text-paper border-scripta'
                    : 'bg-white/60 text-ink/60 border-line hover:border-scripta/50'
                }`}
              >
                {PLATFORM_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        {campaigns.length > 0 && (
          <div>
            <label className="block text-sm font-label text-ink/70 mb-1">part of a campaign?</label>
            <select
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              className="w-full px-3 py-2 rounded border-2 border-line bg-white/70 text-sm"
            >
              <option value="">not part of one</option>
              {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-label text-ink/70 mb-2">photo or clip (optional)</label>
          {!media ? (
            <div>
              <div className="flex gap-1 mb-2 text-xs font-label">
                <button
                  type="button"
                  onClick={() => setMediaMode('upload')}
                  className={`px-2 py-1 rounded-full border-2 ${mediaMode === 'upload' ? 'bg-ink text-paper border-ink' : 'border-line text-ink/60'}`}
                >
                  upload my own
                </button>
                <button
                  type="button"
                  onClick={() => setMediaMode('generate')}
                  className={`px-2 py-1 rounded-full border-2 ${mediaMode === 'generate' ? 'bg-ink text-paper border-ink' : 'border-line text-ink/60'}`}
                >
                  ✨ generate with AI
                </button>
              </div>

              {mediaMode === 'upload' ? (
                <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleFileSelect} className="text-sm font-body text-ink/70" />
              ) : (
                <div className="flex gap-2">
                  <input
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    placeholder="describe the image, e.g. cozy coffee shop, warm morning light"
                    className="flex-1 px-3 py-2 rounded border-2 border-line bg-white/70 focus:bg-white transition text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateImage}
                    disabled={mediaBusy || !imagePrompt.trim()}
                    className="px-3 py-2 rounded bg-scripta text-paper text-xs font-label hover:bg-scriptaDeep transition disabled:opacity-40 shrink-0"
                  >
                    {mediaBusy ? 'painting…' : 'generate'}
                  </button>
                </div>
              )}
              {mediaBusy && mediaMode === 'upload' && <p className="text-xs text-ink/40 font-label mt-1">uploading…</p>}
              {mediaError && <p className="text-xs text-clay font-label mt-1">{mediaError}</p>}
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <div className="polaroid w-28 -rotate-2">
                {media.mediaType === 'video' ? (
                  <video src={media.originalUrl} className="h-20 object-cover" />
                ) : (
                  <img src={media.originalUrl} alt="" className="h-20 object-cover" />
                )}
              </div>
              <div className="text-xs font-label text-ink/60">
                <p className="mb-1">
                  attached{media.provider === 'grok' ? ' — generated with Grok' : media.provider === 'pollinations' ? ' — generated free' : ''}
                  , we'll auto-crop a copy for each platform below
                </p>
                <button type="button" onClick={clearMedia} className="text-clay hover:underline">remove</button>
              </div>
            </div>
          )}
        </div>

        {error && <p className="text-clay text-sm font-label">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="px-4 py-2 rounded bg-scripta text-paper text-sm font-label tracking-wide hover:bg-scriptaDeep transition disabled:opacity-50"
        >
          {busy ? 'writing…' : 'write my posts'}
        </button>
      </form>

      {drafts && (
        <div className="space-y-8">
          <h2 className="font-display text-3xl text-ink">Review & paste in</h2>
          {drafts.map((d, i) => {
            const fitted = fittedByPlatform[d.platform];
            return (
              <div key={d.platform} className={`journal-page torn-edge-top rounded-b-lg px-5 pt-7 pb-5 relative ${ROTATIONS[i % ROTATIONS.length]} space-y-2`}>
                <div className={`washi-tape ${i % 2 === 0 ? '' : 'washi-pine'}`} />
                <div className="flex items-center justify-between">
                  <div className="ink-stamp inline-block px-2 py-0.5 text-xs font-label uppercase tracking-wide text-scripta -rotate-2">
                    {PLATFORM_LABELS[d.platform] || d.platform}
                  </div>
                  {media && <span className="text-xs text-ink/40 font-mono">{PLATFORM_RATIOS[d.platform]}</span>}
                </div>

                {media && (
                  <div className="pt-1">
                    {fittingPlatform === d.platform && <p className="text-xs text-ink/40 font-label">fitting to {PLATFORM_RATIOS[d.platform]}…</p>}
                    {fitted && (
                      <div className="polaroid w-40 -rotate-1">
                        {fitted.mediaType === 'video' ? (
                          <video src={fitted.url} controls className="max-h-40" />
                        ) : (
                          <img src={fitted.url} alt="" className="max-h-40" />
                        )}
                      </div>
                    )}
                    {!fitted && fittingPlatform !== d.platform && (
                      <button type="button" onClick={() => fitForPlatform(d.platform)} className="text-xs text-scripta hover:underline font-label">
                        crop photo to fit {PLATFORM_LABELS[d.platform]}
                      </button>
                    )}
                  </div>
                )}

                <textarea
                  value={d.content}
                  onChange={(e) => updateDraft(d.platform, e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 rounded border-2 border-line bg-white/80 text-sm"
                />
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button onClick={() => saveDraft(d.platform, d.content)} className="px-3 py-1.5 rounded bg-ink text-paper text-xs font-label hover:bg-ink/80 transition">
                    save as draft
                  </button>
                  <input
                    type="datetime-local"
                    value={scheduleFor[d.platform] || ''}
                    onChange={(e) => setScheduleFor({ ...scheduleFor, [d.platform]: e.target.value })}
                    className="px-2 py-1.5 rounded border-2 border-line bg-white/80 text-xs font-mono"
                  />
                  <button
                    onClick={() => schedule(d.platform, d.content)}
                    disabled={!scheduleFor[d.platform]}
                    className="px-3 py-1.5 rounded bg-scripta text-paper text-xs font-label hover:bg-scriptaDeep transition disabled:opacity-40"
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
  );
}
