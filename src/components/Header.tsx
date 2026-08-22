import React from 'react';
import { Sun, Moon, Monitor, Download, Copy, Check } from 'lucide-react';

interface HeaderProps {
  activeTab: 'showcase' | 'playground' | 'customizer' | 'a11y' | 'docs';
  setActiveTab: (tab: 'showcase' | 'playground' | 'customizer' | 'a11y' | 'docs') => void;
  theme: 'auto' | 'light' | 'dark';
  setTheme: (theme: 'auto' | 'light' | 'dark') => void;
  onCopyCss: () => void;
  onDownloadCss: () => void;
  copied: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  theme,
  setTheme,
  onCopyCss,
  onDownloadCss,
  copied,
}) => {
  return (
    <header>
      <div data-header-container>
        <nav>
          {/* Logo & Info */}
          <div data-flex>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                backgroundColor: 'var(--color-primary)',
                color: '#ffffff',
                boxShadow: 'var(--shadow-sm)',
                flexShrink: 0,
              }}
              aria-hidden="true"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 6a3 3 0 0 0-5-2H9a3.5 3.5 0 0 0 0 7h6a3.5 3.5 0 0 1 0 7h-2a3.5 3.5 0 0 1-3.5-3.5" />
              </svg>
            </div>
            <h1 style={{ margin: 0, border: 0, padding: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              SuCSS
            </h1>
            <span data-badge>v1.0 • 素のHTML</span>
          </div>

          {/* Actions & Theme */}
          <div data-flex>
            {/* Theme Toggle Buttons */}
            <div data-flex style={{ gap: '0.25rem' }}>
              <button
                type="button"
                onClick={() => setTheme('light')}
                data-secondary={theme !== 'light' ? 'true' : undefined}
                aria-current={theme === 'light' ? 'true' : undefined}
                title="ライトモード"
                style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
              >
                <Sun size={14} /> Light
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                data-secondary={theme !== 'dark' ? 'true' : undefined}
                aria-current={theme === 'dark' ? 'true' : undefined}
                title="ダークモード"
                style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
              >
                <Moon size={14} /> Dark
              </button>
              <button
                type="button"
                onClick={() => setTheme('auto')}
                data-secondary={theme !== 'auto' ? 'true' : undefined}
                aria-current={theme === 'auto' ? 'true' : undefined}
                title="システム設定"
                style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
              >
                <Monitor size={14} /> Auto
              </button>
            </div>

            {/* Actions */}
            <div data-flex style={{ gap: '0.35rem' }}>
              <button
                type="button"
                onClick={onCopyCss}
                data-secondary="true"
                title="CSSをコピー"
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'コピー完了' : 'CSSコピー'}</span>
              </button>
              <button
                type="button"
                onClick={onDownloadCss}
                title="CSSをダウンロード"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
              >
                <Download size={14} />
                <span>ダウンロード</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Tab Navigation */}
        <nav data-tabs>
          <button
            type="button"
            onClick={() => setActiveTab('showcase')}
            aria-current={activeTab === 'showcase' ? 'page' : undefined}
          >
            🎨 UI見本
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('playground')}
            aria-current={activeTab === 'playground' ? 'page' : undefined}
          >
            ⚡ HTMLプレビュー
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('customizer')}
            aria-current={activeTab === 'customizer' ? 'page' : undefined}
          >
            🎛️ カスタマイザー
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('a11y')}
            aria-current={activeTab === 'a11y' ? 'page' : undefined}
          >
            ♿ アクセシビリティ
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('docs')}
            aria-current={activeTab === 'docs' ? 'page' : undefined}
          >
            📖 ガイド
          </button>
        </nav>
      </div>
    </header>
  );
};
