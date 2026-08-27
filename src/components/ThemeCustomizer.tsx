import React, { useState } from 'react';
import { Sliders, RotateCcw, Copy, Check, Palette, Eye, Code } from 'lucide-react';

export interface ThemeConfig {
  hue: number;
  sat: number;
  baseSize: number; // in rem e.g. 1
  lineHeight: number;
  maxWidth: number; // in px e.g. 820
  radius: number; // in rem e.g. 0.5
  fontSans: string;
  lightBgBody: string;
  lightBgSurface: string;
  darkBgBody: string;
  darkBgSurface: string;
}

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  hue: 158,
  sat: 90,
  baseSize: 1,
  lineHeight: 1.6,
  maxWidth: 860,
  radius: 0.375,
  fontSans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Meiryo", sans-serif',
  lightBgBody: '#f7f9fa',
  lightBgSurface: '#ffffff',
  darkBgBody: '#121820',
  darkBgSurface: '#1c2431',
};

interface ThemeCustomizerProps {
  config: ThemeConfig;
  setConfig: React.Dispatch<React.SetStateAction<ThemeConfig>>;
}

export const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({ config, setConfig }) => {
  const [copied, setCopied] = useState(false);

  const resetTheme = () => {
    setConfig(DEFAULT_THEME_CONFIG);
  };

  const fontOptions = [
    { label: 'System Sans (標準)', value: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
    { label: 'Modern Geometric', value: 'system-ui, "SF Pro Display", "Plus Jakarta Sans", sans-serif' },
    { label: 'Classic Serif', value: 'Georgia, Cambria, "Times New Roman", Times, serif' },
    { label: 'Monospace Code Style', value: 'ui-monospace, "SFMono-Regular", Menlo, Monaco, Consolas, monospace' },
  ];

  // Generated CSS Variables snippet
  const generatedCssVariables = `:root {
  /* Color System */
  --hue: ${config.hue};
  --sat: ${config.sat}%;

  /* Typography & Layout */
  --font-sans: ${config.fontSans};
  --base-size: ${config.baseSize}rem;
  --line-height: ${config.lineHeight};
  --max-width: ${config.maxWidth}px;
  --radius: ${config.radius}rem;

  /* Custom Light Mode Neutral Overrides */
  --bg-body: ${config.lightBgBody};
  --bg-surface: ${config.lightBgSurface};
}

/* Custom Dark Mode Neutral Overrides */
[data-theme="dark"] {
  --bg-body: ${config.darkBgBody};
  --bg-surface: ${config.darkBgSurface};
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCssVariables);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section style={{ margin: 0 }}>
      {/* Controls Form (Left Column) */}
      <article style={{ margin: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', margin: 0, padding: 0, border: 0, fontSize: '1.15rem', gap: '0.35rem' }}>
            <Sliders size={20} /> CSS変数リアルタイム編集
          </h2>
          <button
            type="button"
            onClick={resetTheme}
            style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', minHeight: 'auto' }}
          >
            <RotateCcw size={14} /> リセット
          </button>
        </div>

        <form style={{ gap: '1.25rem' }}>
          {/* Hue & Saturation Slider */}
          <fieldset>
            <legend>カラー・色相カスタマイズ</legend>
            <label>
              <span>ブランドカラー Hue (色相): {config.hue}°</span>
              <input
                type="range"
                min="0"
                max="360"
                value={config.hue}
                onChange={(e) => setConfig((prev) => ({ ...prev, hue: Number(e.target.value) }))}
              />
            </label>
            <div
              style={{
                height: '12px',
                width: '100%',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: `hsl(${config.hue}, ${config.sat}%, 48%)`,
                border: '1px solid var(--border-color)',
              }}
            />

            <label>
              <span>彩度 Saturation: {config.sat}%</span>
              <input
                type="range"
                min="10"
                max="100"
                value={config.sat}
                onChange={(e) => setConfig((prev) => ({ ...prev, sat: Number(e.target.value) }))}
              />
            </label>
          </fieldset>

          {/* Geometry & Typography Controls */}
          <fieldset>
            <legend>タイポグラフィ & レイアウト</legend>
            <label>
              <span>フォントファミリー (--font-sans)</span>
              <select
                value={config.fontSans}
                onChange={(e) => setConfig((prev) => ({ ...prev, fontSans: e.target.value }))}
              >
                {fontOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <label>
                <span>角丸 (--radius): {config.radius}rem</span>
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.1"
                  value={config.radius}
                  onChange={(e) => setConfig((prev) => ({ ...prev, radius: Number(e.target.value) }))}
                />
              </label>

              <label>
                <span>最大幅 (--max-width): {config.maxWidth}px</span>
                <input
                  type="range"
                  min="600"
                  max="1100"
                  step="20"
                  value={config.maxWidth}
                  onChange={(e) => setConfig((prev) => ({ ...prev, maxWidth: Number(e.target.value) }))}
                />
              </label>

              <label>
                <span>基準フォントサイズ: {config.baseSize}rem</span>
                <input
                  type="range"
                  min="0.875"
                  max="1.25"
                  step="0.025"
                  value={config.baseSize}
                  onChange={(e) => setConfig((prev) => ({ ...prev, baseSize: Number(e.target.value) }))}
                />
              </label>

              <label>
                <span>行間 (--line-height): {config.lineHeight}</span>
                <input
                  type="range"
                  min="1.4"
                  max="2.0"
                  step="0.05"
                  value={config.lineHeight}
                  onChange={(e) => setConfig((prev) => ({ ...prev, lineHeight: Number(e.target.value) }))}
                />
              </label>
            </div>
          </fieldset>

          {/* Custom Colors */}
          <fieldset>
            <legend>背景色カスタマイズ</legend>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
              <label>
                <span>Light Body 背景色</span>
                <input
                  type="color"
                  value={config.lightBgBody}
                  onChange={(e) => setConfig((prev) => ({ ...prev, lightBgBody: e.target.value }))}
                />
              </label>

              <label>
                <span>Light Surface カード色</span>
                <input
                  type="color"
                  value={config.lightBgSurface}
                  onChange={(e) => setConfig((prev) => ({ ...prev, lightBgSurface: e.target.value }))}
                />
              </label>

              <label>
                <span>Dark Body 背景色</span>
                <input
                  type="color"
                  value={config.darkBgBody}
                  onChange={(e) => setConfig((prev) => ({ ...prev, darkBgBody: e.target.value }))}
                />
              </label>

              <label>
                <span>Dark Surface カード色</span>
                <input
                  type="color"
                  value={config.darkBgSurface}
                  onChange={(e) => setConfig((prev) => ({ ...prev, darkBgSurface: e.target.value }))}
                />
              </label>
            </div>
          </fieldset>
        </form>
      </article>

      {/* Generated CSS Snippet Output (Right Column) */}
      <article style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', margin: 0, gap: '0.35rem' }}>
            <Code size={20} /> 生成されたCSSコード
          </h3>
          <button
            type="button"
            onClick={handleCopy}
            style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', minHeight: 'auto' }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'コピー完了！' : 'CSSコードをコピー'}</span>
          </button>
        </div>

        <p style={{ margin: 0 }}>
          <small>プロジェクトのCSSまたは <code>&lt;style&gt;</code> タグ内に貼り付けるだけでカスタマイズが適用されます。</small>
        </p>

        <pre style={{ margin: 0 }}>
          <code>{generatedCssVariables}</code>
        </pre>

        {/* Live Card Sample */}
        <aside style={{ margin: 0 }}>
          <strong style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
            <Eye size={16} /> プレビューカードサンプル
          </strong>
          <small>パラメータ変更に応じて、現在のページ全体およびカードの見た目が動的にリアルタイム反映されます。</small>
        </aside>
      </article>
    </section>
  );
};
