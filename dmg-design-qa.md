# WeSight macOS DMG Design QA

final result: passed

## Evidence

- Source visual truth: `docs/design-assets/wesight-macos-dmg-installer-concept-v1.png`
- Implementation screenshot: `docs/design-assets/wesight-dmg-finder-final.jpg`
- Full-view comparison: `docs/design-assets/wesight-dmg-design-comparison.png`
- Initial failed implementation: `docs/design-assets/wesight-dmg-finder-attempt-1.jpg`
- DMG background assets: `build/dmg-background.png` and `build/dmg-background@2x.png`
- Packaged artifact used for QA: `release/WeSight.1.0.2.mac.arm64.dmg`
- Finder state: mounted `WeSight Installer 1.0.2` DMG, icon view, macOS dark appearance, no item selected

## Viewport And Density

- Source pixels: 1586 × 992 at 2× density.
- Source normalized size: 793 × 496.
- Implementation pixels: 793 × 496 at 1× screenshot density.
- DMG Finder window: 793 × 496.
- Comparison method: the source was downsampled to 793 × 496 and placed beside the implementation without additional cropping.

## Findings

- No actionable P0, P1, or P2 differences remain.
- Fonts and typography: the baked WeSight title, subtitle, and installation prompt preserve the source hierarchy and weight. Finder item labels use the native macOS system font as required by Finder.
- Spacing and layout rhythm: the two item centers match the configured positions at `(220, 326)` and `(584, 326)`. The panel, arrow, labels, and window edges remain balanced at the production Finder size.
- Colors and visual tokens: the teal forest palette, warm sunrise highlight, cream display text, glass panel, and gold installation arrow remain consistent with the selected concept.
- Image quality and asset fidelity: the packaged DMG includes a two-resolution TIFF generated from 793 × 496 and 1586 × 992 source assets. The mounted Finder background is sharp and complete.
- Copy and content: “WeSight”, “本机 AI Agent 桌面工作台”, and “拖动安装” match the selected concept. Finder hides the `.app` extension and displays `WeSight`, which follows native macOS behavior.
- Version presentation: the mounted Finder window uses the pure numeric `1.0.2` version in its volume title.
- Native platform variance: the selected concept uses a light title bar while the QA machine uses macOS dark appearance. Finder owns this chrome and switches it with the user’s system appearance.
- P3 follow-up: the visible WeSight artwork is slightly smaller than the concept because the production `.icns` includes standard macOS icon padding. The current result keeps the Applications icon at the intended scale and preserves balanced spacing.

## Focused Region Review

A separate crop was not needed. Each 793 × 496 half of the full comparison keeps the title, panel border, icon artwork, arrow, and labels readable at 1:1 display size.

## Comparison History

### Iteration 1

- Finding: P1 — the mounted DMG showed the system dark background and omitted the branded image.
- Evidence: `docs/design-assets/wesight-dmg-finder-attempt-1.jpg`.
- Cause: electron-builder 24 generated the legacy `.background/1.tiff` layout, which the current Finder did not render.
- Fix: upgraded electron-builder and dmg-builder to 26.15.3 so the DMG uses the current root `.background.tiff` layout.

### Iteration 2

- Post-fix evidence: `docs/design-assets/wesight-dmg-finder-final.jpg`.
- Result: the branded background, Retina TIFF, icon view, icon placement, labels, and Applications link all render correctly in Finder.

## Implementation Checklist

- [x] Use the selected WeSight visual direction.
- [x] Include 1× and 2× DMG background assets.
- [x] Configure the Finder window, item positions, item size, and labels.
- [x] Use the production WeSight `.icns`.
- [x] Package and mount a real arm64 DMG.
- [x] Verify the mounted volume contains `WeSight.app`, the Applications link, `.DS_Store`, and `.background.tiff`.
- [x] Compare the selected concept and mounted Finder window at matching dimensions.
