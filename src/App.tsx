import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Showcase } from './components/Showcase';
import { Playground } from './components/Playground';
import { ThemeCustomizer, DEFAULT_THEME_CONFIG, ThemeConfig } from './components/ThemeCustomizer';
import { AccessibilityChecker } from './components/AccessibilityChecker';
import { DocsSection } from './components/DocsSection';
import classicCssRaw from './lib/sucss.css?raw';
import classicCssUrl from './lib/sucss.css?url';
import glassCssRaw from './lib/themes/glassmorphism.css?raw';
import glassCssUrl from './lib/themes/glassmorphism.css?url';

export type DesignStyle = 'classic' | 'glass';

export default function App() {
  const [activeTab, setActiveTab] = useState<'showcase' | 'playground' | 'customizer' | 'a11y' | 'docs'>('showcase');
  const [theme, setTheme] = useState<'auto' | 'light' | 'dark'>('auto');
  const [designStyle, setDesignStyle] = useState<DesignStyle>('classic');
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(DEFAULT_THEME_CONFIG);
  const [copiedCss, setCopiedCss] = useState(false);

  const rawCssText = designStyle === 'glass' ? glassCssRaw : classicCssRaw;

  // The active design-taste stylesheet is loaded through a single, plain
  // <link> element managed directly via the DOM (bypassing React 19's
  // stylesheet-resource hoisting, which otherwise fights manual href
  // swaps). Switching designStyle simply repoints its href.
  const styleLinkRef = useRef<HTMLLinkElement | null>(null);

  useLayoutEffect(() => {
    if (!styleLinkRef.current) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      document.head.appendChild(link);
      styleLinkRef.current = link;
    }
    styleLinkRef.current.href = designStyle === 'glass' ? glassCssUrl : classicCssUrl;
  }, [designStyle]);

  // Apply theme attribute, Tailwind dark class & CSS variables to html document
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    // The ThemeCustomizer tab only knows about Classic's token values, so its
    // live overrides should only apply while Classic is the active design
    // taste — otherwise they'd stamp Classic's green hue and flat colors
    // over Glass 2.0's own violet/frosted defaults. When Glass is active,
    // clear any inline overrides left over from Classic instead.
    const customizableVars = ['--hue', '--sat', '--font-sans', '--base-size', '--line-height', '--max-width', '--radius', '--bg-body', '--bg-surface'];

    if (designStyle === 'classic') {
      root.style.setProperty('--hue', String(themeConfig.hue));
      root.style.setProperty('--sat', `${themeConfig.sat}%`);
      root.style.setProperty('--font-sans', themeConfig.fontSans);
      root.style.setProperty('--base-size', `${themeConfig.baseSize}rem`);
      root.style.setProperty('--line-height', String(themeConfig.lineHeight));
      root.style.setProperty('--max-width', `${themeConfig.maxWidth}px`);
      root.style.setProperty('--radius', `${themeConfig.radius}rem`);
    } else {
      customizableVars.forEach((name) => root.style.removeProperty(name));
    }

    const updateTheme = () => {
      const isDark = theme === 'dark' || (theme === 'auto' && mediaQuery.matches);

      if (theme === 'dark') {
        root.setAttribute('data-theme', 'dark');
      } else if (theme === 'light') {
        root.setAttribute('data-theme', 'light');
      } else {
        root.removeAttribute('data-theme');
      }

      if (designStyle !== 'classic') {
        root.classList.remove('dark');
        return;
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
  }, [theme, themeConfig, designStyle]);

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
    a.download = designStyle === 'glass' ? 'sucss.glass.css' : 'sucss.css';
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
        designStyle={designStyle}
        setDesignStyle={setDesignStyle}
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
          <AccessibilityChecker config={themeConfig} theme={theme} designStyle={designStyle} />
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

