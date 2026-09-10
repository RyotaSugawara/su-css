import React from 'react';
import { Sun, Moon, Monitor, Download, Copy, Check } from 'lucide-react';
import markUrl from '@/assets/brand/mark.svg';

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
      <div>
        <nav>
          {/* Logo & Info */}
          <div>
            {/* The brand mark from assets/brand/. Its own box carries the drop
                shadow, so it is sized by height and left to keep its ratio. */}
            <img
              src={markUrl}
              alt=""
              height={34}
              style={{ height: '34px', width: 'auto', flexShrink: 0 }}
            />
            <h1 style={{ margin: 0, border: 0, padding: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              SuCSS
            </h1>
          </div>

          {/* Actions & Theme */}
          <div>
            {/* Theme Toggle Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <button
                type="button"
                onClick={() => setTheme('light')}
                aria-current={theme === 'light' ? 'true' : undefined}
                title="ライトモード"
                style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
              >
                <Sun size={14} /> Light
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                aria-current={theme === 'dark' ? 'true' : undefined}
                title="ダークモード"
                style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
              >
                <Moon size={14} /> Dark
              </button>
              <button
                type="button"
                onClick={() => setTheme('auto')}
                aria-current={theme === 'auto' ? 'true' : undefined}
                title="システム設定"
                style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
              >
                <Monitor size={14} /> Auto
              </button>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <button
                type="button"
                onClick={onCopyCss}
                title="CSSをコピー"
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'コピー完了' : 'CSSコピー'}</span>
              </button>
              <button
                type="submit"
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
        <nav>
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
