import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  Save,
  Loader2,
  ChevronDown,
  X,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Box,
  KeyRound,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { fetchFigmaTemplate as fetchFigmaMock, EXAMPLE_FIGMA_URLS } from '../../mocks/figma';
import { fetchFigmaTemplate as fetchFigmaReal } from '../../figma/api';
import type { ImageTextValue, LocalizedText } from '../../types';

export default function ImageEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const {
    images,
    texts,
    figmaToken,
    setFigmaToken,
    createImage,
    updateImageTemplate,
    updateImageTextValues,
    updateImageName,
    saveImage,
  } = useStore();

  const [tokenInput, setTokenInput] = useState(figmaToken);
  const [showTokenInput, setShowTokenInput] = useState(!figmaToken);

  const image = isNew ? null : images.find((i) => i.id === id);

  const [name, setName] = useState(image?.name ?? 'Untitled Image');
  const [figmaUrl, setFigmaUrl] = useState(image?.figmaUrl ?? '');
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fetchSuccess, setFetchSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(isNew ? null : id ?? null);
  const [textValues, setTextValues] = useState<ImageTextValue[]>(image?.textValues ?? []);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [dropdownSearch, setDropdownSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentImage = currentId ? images.find((i) => i.id === currentId) : null;
  const template = currentImage?.template ?? null;

  useEffect(() => {
    if (currentImage) {
      setTextValues(currentImage.textValues);
    }
  }, [currentImage?.id]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
        setDropdownSearch('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleSaveToken() {
    setFigmaToken(tokenInput.trim());
    setShowTokenInput(false);
  }

  async function handleFetch() {
    if (!figmaUrl.trim()) return;
    setFetching(true);
    setFetchError(null);
    setFetchSuccess(false);
    try {
      const tmpl = figmaToken
        ? await fetchFigmaReal(figmaUrl.trim(), figmaToken)
        : await fetchFigmaMock(figmaUrl.trim());
      let imgId = currentId;
      if (!imgId) {
        const created = createImage(name, figmaUrl.trim());
        imgId = created.id;
        setCurrentId(imgId);
      } else {
        updateImageName(imgId, name);
      }
      updateImageTemplate(imgId, tmpl);
      const freshImage = images.find((i) => i.id === imgId);
      setTextValues(freshImage?.textValues ?? tmpl.textComponents.map((tc) => ({ componentId: tc.id, localizationId: null, customText: '' })));
      setFetchSuccess(true);
      setTimeout(() => setFetchSuccess(false), 3000);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Failed to fetch template');
    } finally {
      setFetching(false);
    }
  }

  function resolveText(tv: ImageTextValue): string {
    if (tv.localizationId) {
      const found = texts.find((t) => t.id === tv.localizationId);
      return found?.value ?? '';
    }
    return tv.customText;
  }

  function setLocalizationForComponent(componentId: string, text: LocalizedText | null) {
    setTextValues((prev) =>
      prev.map((tv) =>
        tv.componentId === componentId
          ? { ...tv, localizationId: text?.id ?? null, customText: text ? text.value : tv.customText }
          : tv,
      ),
    );
    setOpenDropdown(null);
    setDropdownSearch('');
  }

  function setCustomTextForComponent(componentId: string, value: string) {
    setTextValues((prev) =>
      prev.map((tv) =>
        tv.componentId === componentId
          ? { ...tv, localizationId: null, customText: value }
          : tv,
      ),
    );
  }

  async function handleSave() {
    if (!currentId) return;
    setSaving(true);
    updateImageName(currentId, name);
    updateImageTextValues(currentId, textValues);
    saveImage(currentId);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const hasFetched = !!template;
  const filteredTexts = texts.filter(
    (t) =>
      t.key.toLowerCase().includes(dropdownSearch.toLowerCase()) ||
      t.value.toLowerCase().includes(dropdownSearch.toLowerCase()) ||
      t.id.toLowerCase().includes(dropdownSearch.toLowerCase()),
  );

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200">
        <div className="flex items-center gap-4 px-6 py-3">
          <button
            onClick={() => navigate('/images')}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-base font-semibold text-gray-900 bg-transparent border-none outline-none focus:bg-gray-50 px-2 py-1 rounded-lg w-64"
            placeholder="Image name…"
          />
          <div className="flex-1" />

          {/* Token button in header */}
          {figmaToken ? (
            <button
              onClick={() => { setTokenInput(figmaToken); setShowTokenInput(!showTokenInput); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5" />
              Token set
            </button>
          ) : (
            <button
              onClick={() => setShowTokenInput(!showTokenInput)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-300 rounded-lg hover:bg-amber-100 transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5" />
              Add Figma token
            </button>
          )}

          {hasFetched && (
            <button
              onClick={handleSave}
              disabled={saving || !currentId}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : saved ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Saving…' : saved ? 'Saved!' : 'Save'}
            </button>
          )}
        </div>

        {/* Token input panel — drops down from header */}
        {showTokenInput && (
          <div className="px-6 py-4 border-t border-amber-100 bg-amber-50">
            <div className="flex items-start gap-3 max-w-2xl">
              <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 mb-1">Figma personal access token</p>
                <p className="text-xs text-gray-500 mb-3">
                  Required for real Figma integration.{' '}
                  <a
                    href="https://www.figma.com/settings"
                    target="_blank"
                    rel="noreferrer"
                    className="text-violet-600 hover:underline"
                  >
                    Go to figma.com/settings
                  </a>{' '}
                  → "Personal access tokens" → generate a token and paste it here.
                  Without a token the tool uses mock data.
                </p>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveToken()}
                    placeholder="figd_xxxxxxxxxxxxxxxxxxxx"
                    className="flex-1 px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400 font-mono bg-white"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveToken}
                    disabled={!tokenInput.trim()}
                    className="px-4 py-1.5 text-xs font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-40 transition-colors"
                  >
                    Save token
                  </button>
                  <button
                    onClick={() => setShowTokenInput(false)}
                    className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Preview */}
        <div className="flex-1 flex flex-col overflow-auto bg-gray-100 p-6">
          {/* Figma URL bar */}
          <div className="flex gap-2 mb-6">
            <div className="flex items-center gap-2 flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2">
              <Box className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                value={figmaUrl}
                onChange={(e) => setFigmaUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
                placeholder="Paste Figma component URL…"
                className="flex-1 text-sm text-gray-700 bg-transparent outline-none placeholder:text-gray-400"
              />
              {figmaUrl && (
                <button
                  onClick={() => setFigmaUrl('')}
                  className="text-gray-300 hover:text-gray-500"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              onClick={handleFetch}
              disabled={fetching || !figmaUrl.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-24 justify-center"
            >
              {fetching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {fetching ? 'Fetching…' : hasFetched ? 'Update' : 'Fetch'}
            </button>
          </div>

          {/* Example URLs — only shown in mock mode */}
          {!hasFetched && !figmaToken && (
            <div className="mb-4 flex flex-wrap gap-2 items-center">
              <span className="text-xs text-gray-400">Mock examples:</span>
              {EXAMPLE_FIGMA_URLS.map((url) => (
                <button
                  key={url}
                  onClick={() => setFigmaUrl(url)}
                  className="text-xs text-violet-600 hover:underline flex items-center gap-0.5"
                >
                  {url.split('/').pop()}
                  <ExternalLink className="w-2.5 h-2.5" />
                </button>
              ))}
            </div>
          )}

          {fetchError && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {fetchError}
            </div>
          )}

          {fetchSuccess && (
            <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 mb-4">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              Template fetched successfully from Figma
            </div>
          )}

          {/* Image Preview */}
          {template ? (
            <div className="flex-1 flex items-start justify-center">
              <div
                className="relative rounded-xl overflow-hidden shadow-2xl"
                style={{
                  width: '100%',
                  maxWidth: '800px',
                  aspectRatio: `${template.width} / ${template.height}`,
                }}
              >
                <img
                  src={template.imageUrl}
                  alt="Template"
                  className="w-full h-full object-cover block"
                  draggable={false}
                />
                {/* Overlay text components */}
                {template.textComponents.map((tc) => {
                  const tv = textValues.find((v) => v.componentId === tc.id);
                  const display = tv ? resolveText(tv) : '';
                  return (
                    <div
                      key={tc.id}
                      className="absolute select-text"
                      style={{
                        left: `${tc.xPercent}%`,
                        top: `${tc.yPercent}%`,
                        width: `${tc.widthPercent}%`,
                        fontSize: `clamp(10px, ${tc.fontSize / template.width * 100 * 8}vw, ${tc.fontSize}px)`,
                        color: display ? tc.color : 'transparent',
                        fontWeight: tc.fontWeight,
                        textAlign: tc.align,
                        lineHeight: 1.2,
                        textShadow: display ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        outline: display ? 'none' : '1.5px dashed rgba(255,255,255,0.5)',
                        minHeight: '1em',
                        borderRadius: '2px',
                        pointerEvents: 'none',
                      }}
                      title={!display ? tc.name : undefined}
                    >
                      {display}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Box className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-sm font-medium mb-1">No template fetched yet</p>
                <p className="text-xs">Paste a Figma URL above and click Fetch</p>
              </div>
            </div>
          )}

          {template && (
            <p className="text-xs text-gray-400 text-center mt-3">
              Last fetched: {new Date(template.fetchedAt).toLocaleString()}
            </p>
          )}
        </div>

        {/* Right panel: text fields */}
        {template && (
          <div className="w-80 flex-shrink-0 bg-white border-l border-gray-200 overflow-y-auto" ref={dropdownRef}>
            <div className="px-4 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800">Text Components</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {template.textComponents.length} text area{template.textComponents.length !== 1 ? 's' : ''} detected
              </p>
            </div>

            <div className="p-4 space-y-5">
              {template.textComponents.map((tc) => {
                const tv = textValues.find((v) => v.componentId === tc.id);
                const linked = tv?.localizationId
                  ? texts.find((t) => t.id === tv.localizationId)
                  : null;
                const isOpen = openDropdown === tc.id;

                return (
                  <div key={tc.id} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-gray-700">{tc.name}</label>
                      <span className="text-[10px] text-gray-400 font-mono">{tc.id}</span>
                    </div>

                    {/* Localization picker */}
                    <div className="relative">
                      <button
                        onClick={() => {
                          setOpenDropdown(isOpen ? null : tc.id);
                          setDropdownSearch('');
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs border rounded-lg transition-colors ${
                          linked
                            ? 'border-violet-300 bg-violet-50 text-violet-700'
                            : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        <span className="truncate">
                          {linked ? (
                            <span className="flex items-center gap-1.5">
                              <span className="font-mono text-[10px] bg-violet-200 px-1 py-0.5 rounded">{linked.id}</span>
                              {linked.key}
                            </span>
                          ) : (
                            'Link to localized text…'
                          )}
                        </span>
                        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                          {linked && (
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => {
                                e.stopPropagation();
                                setLocalizationForComponent(tc.id, null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setLocalizationForComponent(tc.id, null);
                                }
                              }}
                              className="text-violet-400 hover:text-violet-600 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </span>
                          )}
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </div>
                      </button>

                      {isOpen && (
                        <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                          <div className="p-2 border-b border-gray-100">
                            <input
                              type="text"
                              value={dropdownSearch}
                              onChange={(e) => setDropdownSearch(e.target.value)}
                              placeholder="Search texts…"
                              className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-400"
                              autoFocus
                            />
                          </div>
                          <div className="max-h-48 overflow-y-auto">
                            {filteredTexts.length === 0 ? (
                              <p className="px-3 py-3 text-xs text-gray-400 text-center">
                                {texts.length === 0 ? 'No localized texts yet' : 'No results'}
                              </p>
                            ) : (
                              filteredTexts.map((t) => (
                                <button
                                  key={t.id}
                                  onClick={() => setLocalizationForComponent(tc.id, t)}
                                  className={`w-full text-left px-3 py-2.5 hover:bg-violet-50 transition-colors ${
                                    tv?.localizationId === t.id ? 'bg-violet-50' : ''
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-[10px] text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded flex-shrink-0">
                                      {t.id}
                                    </span>
                                    <span className="text-xs font-medium text-gray-700 truncate">{t.key}</span>
                                  </div>
                                  <p className="text-[11px] text-gray-400 mt-0.5 truncate pl-0">{t.value}</p>
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Custom text input (shown when not linked) */}
                    {!linked && (
                      <input
                        type="text"
                        value={tv?.customText ?? ''}
                        onChange={(e) => setCustomTextForComponent(tc.id, e.target.value)}
                        placeholder="Or type custom text…"
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                      />
                    )}

                    {/* Preview value */}
                    {(linked || tv?.customText) && (
                      <div className="px-3 py-2 bg-gray-50 rounded-lg">
                        <p className="text-[11px] text-gray-500 font-medium mb-0.5">Preview</p>
                        <p className="text-xs text-gray-700 break-words">
                          {linked ? linked.value : tv?.customText}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
