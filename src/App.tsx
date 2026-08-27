import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Showcase } from './components/Showcase';
import { Playground } from './components/Playground';
import { ThemeCustomizer, DEFAULT_THEME_CONFIG, ThemeConfig } from './components/ThemeCustomizer';
import { AccessibilityChecker } from './components/AccessibilityChecker';
import { DocsSection } from './components/DocsSection';
import rawCssText from './lib/sucss.css?raw';
import './lib/sucss.css';

export default function App() {
  const [activeTab, setActiveTab] = useState<'showcase' | 'playground' | 'customizer' | 'a11y' | 'docs'>('showcase');
  const [theme, setTheme] = useState<'auto' | 'light' | 'dark'>('auto');
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(DEFAULT_THEME_CONFIG);
  const [copiedCss, setCopiedCss] = useState(false);

  // Apply theme attribute, Tailwind dark class & CSS variables to html document
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    // Common CSS variables
    root.style.setProperty('--hue', String(themeConfig.hue));
    root.style.setProperty('--sat', `${themeConfig.sat}%`);
    root.style.setProperty('--font-sans', themeConfig.fontSans);
    root.style.setProperty('--base-size', `${themeConfig.baseSize}rem`);
    root.style.setProperty('--line-height', String(themeConfig.lineHeight));
    root.style.setProperty('--max-width', `${themeConfig.maxWidth}px`);
    root.style.setProperty('--radius', `${themeConfig.radius}rem`);

    const updateTheme = () => {
      const isDark = theme === 'dark' || (theme === 'auto' && mediaQuery.matches);

      if (theme === 'dark') {
        root.setAttribute('data-theme', 'dark');
      } else if (theme === 'light') {
        root.setAttribute('data-theme', 'light');
      } else {
        root.removeAttribute('data-theme');
      }

      if (isDark) {
        root.classList.add('dark');
        root.style.setProperty('--bg-body', themeConfig.darkBgBody);
        root.style.setProperty('--bg-surface', themeConfig.darkBgSurface);
      } else {
        root.classList.remove('dark');
        root.style.setProperty('--bg-body', themeConfig.lightBgBody);
        root.style.setProperty('--bg-surface', themeConfig.lightBgSurface);
      }
    };

    updateTheme();

    mediaQuery.addEventListener('change', updateTheme);
    return () => mediaQuery.removeEventListener('change', updateTheme);
  }, [theme, themeConfig]);

  // Copy full CSS library text
  const handleCopyCss = () => {
    navigator.clipboard.writeText(rawCssText);
    setCopiedCss(true);
    setTimeout(() => setCopiedCss(false), 2000);
  };

  // Download CSS file
  const handleDownloadCss = () => {
    const blob = new Blob([rawCssText], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sucss.css';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Header with Nav & Actions */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        setTheme={setTheme}
        onCopyCss={handleCopyCss}
        onDownloadCss={handleDownloadCss}
        copied={copiedCss}
      />

      {/* Main Content Area */}
      <main>
        {activeTab === 'showcase' && <Showcase theme={theme} />}
        {activeTab === 'playground' && <Playground theme={theme} />}
        {activeTab === 'customizer' && (
          <ThemeCustomizer config={themeConfig} setConfig={setThemeConfig} />
        )}
        {activeTab === 'a11y' && (
          <AccessibilityChecker config={themeConfig} theme={theme} />
        )}
        {activeTab === 'docs' && <DocsSection />}
      </main>

      {/* Footer */}
      <footer>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <strong>SuCSS</strong>
            <small>— 素のHTMLを使った高アクセシブル軽量クラスレスCSS</small>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <small>ライセンス: MIT</small>
            <small>•</small>
            <small>ダークモード標準対応</small>
            <small>•</small>
            <small>Zero JS Dependencies</small>
          </div>
        </div>
      </footer>
    </>
  );
}

