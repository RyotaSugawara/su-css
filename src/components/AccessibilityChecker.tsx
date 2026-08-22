import React from 'react';
import { ShieldCheck, MousePointer, Eye, CheckCircle2, Sun, Moon, Sparkles } from 'lucide-react';
import { ThemeConfig } from './ThemeCustomizer';
import { getContrastRatio, getWcagLevel, hexToRgb, hslToRgb } from '../lib/colorUtils';

interface AccessibilityCheckerProps {
  config: ThemeConfig;
  theme: 'auto' | 'light' | 'dark';
}

export const AccessibilityChecker: React.FC<AccessibilityCheckerProps> = ({ config }) => {
  // Primary RGB in Light Mode
  const primaryRgbLight = hslToRgb(config.hue, config.sat, 36);
  const bodyBgLight = hexToRgb(config.lightBgBody);
  const textMainLight: [number, number, number] = [17, 24, 39]; // #111827
  const whiteRgb: [number, number, number] = [255, 255, 255];

  // Primary RGB in Dark Mode
  const primaryRgbDark = hslToRgb(config.hue, config.sat, 45);
  const bodyBgDark = hexToRgb(config.darkBgBody);
  const textMainDark: [number, number, number] = [249, 250, 251]; // #f9fafb
  const darkBtnText: [number, number, number] = [255, 255, 255]; // white text on primary button

  // Ratios
  const ratioLightTextBg = getContrastRatio(textMainLight, bodyBgLight);
  const ratioLightBtn = getContrastRatio(whiteRgb, primaryRgbLight);

  const ratioDarkTextBg = getContrastRatio(textMainDark, bodyBgDark);
  const ratioDarkBtn = getContrastRatio(darkBtnText, primaryRgbDark);

  const statusLightTextBg = getWcagLevel(ratioLightTextBg);
  const statusLightBtn = getWcagLevel(ratioLightBtn);
  const statusDarkTextBg = getWcagLevel(ratioDarkTextBg);
  const statusDarkBtn = getWcagLevel(ratioDarkBtn);

  const a11yFeatures = [
    {
      title: 'タッチターゲットの最小サイズ保証 (44px)',
      description: 'ボタンおよびすべてのフォーム入力要素は、モバイル操作でも押し間違えないよう最小44pxのタッチ領域を自動確保します。',
      status: '適用済',
      icon: MousePointer
    },
    {
      title: '視認性の高いフォーカスリング (:focus-visible)',
      description: 'キーボード操作（Tabキー）時に鮮明な3pxフォーカスリング（--focus-ring）を表示し、現在の操作位置を明確化します。',
      status: '適用済',
      icon: ShieldCheck
    },
    {
      title: '視覚アニメーションの抑制 (prefers-reduced-motion)',
      description: 'OSで「動きを減らす」が設定されているユーザー向けに、すべてのトランジションおよびアニメーションを即座に無効化します。',
      status: '適用済',
      icon: Eye
    },
    {
      title: '完全セマンティックHTML対応',
      description: 'divの乱用を避け、aria属性やセマンティックタグ（header, nav, main, article, details, dialog）の標準スクリーンリーダー読み上げを最大化します。',
      status: '適用済',
      icon: CheckCircle2
    }
  ];

  return (
    <article style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Overview Banner */}
      <section style={{ margin: 0 }}>
        <div data-flex>
          <ShieldCheck size={28} />
          <div>
            <h2 style={{ margin: 0, padding: 0, border: 0 }}>アクセシビリティ (a11y) 検証レポート</h2>
            <small>SuCSSはWCAG 2.1 AA / AAA 規格を前提とした色コントラスト比と操作性を標準設計しています</small>
          </div>
        </div>
      </section>

      {/* WCAG Contrast Ratio Live Calculators */}
      <section data-grid style={{ margin: 0 }}>
        {/* Light Mode Contrast */}
        <article style={{ margin: 0 }}>
          <div data-flex style={{ justifyContent: 'space-between', marginBottom: '1rem' }}>
            <strong data-flex style={{ gap: '0.35rem' }}>
              <Sun size={18} /> ライトモード コントラスト検証
            </strong>
            <span data-badge>Light Mode</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div data-flex style={{ justifyContent: 'space-between' }}>
              <div>
                <strong>本文テキスト vs 背景色</strong>
                <br />
                <small>コントラスト比: {ratioLightTextBg.toFixed(2)} : 1</small>
              </div>
              <span data-badge style={{ opacity: 0.9 }}>
                {statusLightTextBg.level}
              </span>
            </div>

            <div data-flex style={{ justifyContent: 'space-between' }}>
              <div>
                <strong>プライマリボタン文字 vs ボタン背景</strong>
                <br />
                <small>コントラスト比: {ratioLightBtn.toFixed(2)} : 1</small>
              </div>
              <span data-badge style={{ opacity: 0.9 }}>
                {statusLightBtn.level}
              </span>
            </div>
          </div>
        </article>

        {/* Dark Mode Contrast */}
        <article style={{ margin: 0 }}>
          <div data-flex style={{ justifyContent: 'space-between', marginBottom: '1rem' }}>
            <strong data-flex style={{ gap: '0.35rem' }}>
              <Moon size={18} /> ダークモード コントラスト検証
            </strong>
            <span data-badge>Dark Mode</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div data-flex style={{ justifyContent: 'space-between' }}>
              <div>
                <strong>本文テキスト vs 背景色</strong>
                <br />
                <small>コントラスト比: {ratioDarkTextBg.toFixed(2)} : 1</small>
              </div>
              <span data-badge style={{ opacity: 0.9 }}>
                {statusDarkTextBg.level}
              </span>
            </div>

            <div data-flex style={{ justifyContent: 'space-between' }}>
              <div>
                <strong>プライマリボタン文字 vs ボタン背景</strong>
                <br />
                <small>コントラスト比: {ratioDarkBtn.toFixed(2)} : 1</small>
              </div>
              <span data-badge style={{ opacity: 0.9 }}>
                {statusDarkBtn.level}
              </span>
            </div>
          </div>
        </article>
      </section>

      {/* Accessibility Features Checklist */}
      <section style={{ margin: 0 }}>
        <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={20} /> SuCSS に標準組み込み済みのアクセシビリティ仕様
        </h3>

        <div data-grid>
          {a11yFeatures.map((item, idx) => {
            const Icon = item.icon;
            return (
              <article key={idx} style={{ margin: 0 }}>
                <div data-flex style={{ justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <strong data-flex style={{ gap: '0.35rem' }}>
                    <Icon size={16} />
                    {item.title}
                  </strong>
                  <span data-badge>{item.status}</span>
                </div>
                <small>{item.description}</small>
              </article>
            );
          })}
        </div>
      </section>
    </article>
  );
};
