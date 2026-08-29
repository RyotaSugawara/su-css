import React, { useState } from 'react';
import { Copy, Check, Sparkles, Code, Eye, FileText } from 'lucide-react';
import { HTML_PRESETS } from '../lib/presets';

interface PlaygroundProps {
  theme: 'auto' | 'light' | 'dark';
}

export const Playground: React.FC<PlaygroundProps> = () => {
  const [selectedPreset, setSelectedPreset] = useState<string>('article');
  const [htmlCode, setHtmlCode] = useState<string>(HTML_PRESETS[0].code);
  const [copied, setCopied] = useState<boolean>(false);

  const handleSelectPreset = (presetId: string) => {
    setSelectedPreset(presetId);
    const preset = HTML_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setHtmlCode(preset.code);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(htmlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <article style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', margin: 0 }}>
      {/* Preset selector bar */}
      <section style={{ margin: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Sparkles size={24} />
            <div>
              <h2 style={{ margin: 0, padding: 0, border: 0 }}>HTML ライブプレビュー & 砂場</h2>
              <small>クラスを使わずに直接記述した純粋なHTMLタグをリアルタイムにレンダリングします</small>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <small>プリセット:</small>
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {HTML_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset.id)}
                  aria-current={selectedPreset === preset.id ? 'true' : undefined}
                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', minHeight: 'auto' }}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Editor & Preview Split View */}
      <section style={{ margin: 0 }}>
        {/* HTML Editor Panel */}
        <article style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Code size={18} /> HTML エディタ（クラス不要）
            </strong>
            <button
              type="button"
              onClick={handleCopyCode}
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', minHeight: 'auto' }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'コピー済' : 'コピー'}</span>
            </button>
          </div>

          <textarea
            value={htmlCode}
            onChange={(e) => setHtmlCode(e.target.value)}
            style={{ minHeight: '400px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
            placeholder="<article><h1>タイトル</h1><p>本文...</p></article>"
            spellCheck={false}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <FileText size={14} />
            <small>ヒント: <code>class="..."</code> を書かずにHTML標準タグのみを自由に試せます。</small>
          </div>
        </article>

        {/* Live Preview Panel */}
        <article style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Eye size={18} /> リアルタイムレンダリング結果
            </strong>
            <small>SuCSS v2.0 適用中</small>
          </div>

          <div style={{ padding: '1.25rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', backgroundColor: 'var(--bg-surface)', minHeight: '400px' }}>
            {/* Direct HTML render */}
            <div dangerouslySetInnerHTML={{ __html: htmlCode }} />
          </div>
        </article>
      </section>
    </article>
  );
};
