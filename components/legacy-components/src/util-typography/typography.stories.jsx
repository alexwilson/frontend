import React from 'react'
import './typography.stories.scss'

const scales = [
  { name: 'alpha',   label: 'α alpha',   usage: 'h1 / page titles' },
  { name: 'beta',    label: 'β beta',    usage: 'h2 / section headings' },
  { name: 'gamma',   label: 'γ gamma',   usage: 'h3 / sub-headings' },
  { name: 'delta',   label: 'δ delta',   usage: 'h4' },
  { name: 'epsilon', label: 'ε epsilon', usage: 'h5 / small headings' },
  { name: 'zeta',    label: 'ζ zeta',    usage: 'h6 / body default' },
  { name: 'eta',     label: 'η eta',     usage: 'small headings' },
  { name: 'theta',   label: 'θ theta',   usage: 'captions' },
  { name: 'iota',    label: 'ι iota',    usage: 'fine print' },
]

export default {
  title: 'Legacy/Utils/Typography',
  parameters: { layout: 'padded' },
}

export const TypeScale = {
  render: () => (
    <div className="ds-type-scale">
      <p style={{ fontFamily: 'monospace', fontSize: '12px', color: '#888', marginBottom: '1.5rem' }}>
        Modular scale — Major Third at mobile, Perfect Fourth at desktop
      </p>
      {scales.map(({ name, label, usage }) => (
        <div key={name} className="ds-scale-row">
          <span className="ds-scale-row__label">{label}</span>
          <span className={`ds-scale-row__sample ds-scale-${name}`}>The quick brown fox</span>
          <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#aaa', marginLeft: 'auto' }}>{usage}</span>
        </div>
      ))}
    </div>
  ),
}

export const Headings = {
  render: () => (
    <div className="typeset" style={{ padding: '2rem', maxWidth: '720px' }}>
      <h1>Heading Level One</h1>
      <h2>Heading Level Two</h2>
      <h3>Heading Level Three</h3>
      <h4>Heading Level Four</h4>
      <h5>Heading Level Five</h5>
      <h6>Heading Level Six</h6>
    </div>
  ),
}

export const BodyText = {
  render: () => (
    <div className="typeset" style={{ padding: '2rem', maxWidth: '720px' }}>
      <p>
        This is a standard paragraph. Body text is set in Georgia at <code>zeta</code> scale with a generous
        line-height for comfortable reading. <a href="#">Links use the brand blue</a> with a subtle underline
        treatment derived from the background colour.
      </p>
      <p>
        <strong>Bold text</strong> uses the body font's bold weight. <em>Italic text</em> uses the italic style.
        <small> Small text is set at theta scale.</small>
      </p>
      <blockquote>
        <p>
          A blockquote is set in italic with a brand-coloured left border, providing a clear visual hierarchy
          for pulled quotes or cited material.
        </p>
      </blockquote>
      <p>
        Text utilities: <span className="upper">uppercase tracking</span>, and standard paragraph flow
        continues below.
      </p>
    </div>
  ),
}

export const Lists = {
  render: () => (
    <div className="typeset" style={{ padding: '2rem', maxWidth: '720px' }}>
      <h3>Unordered List</h3>
      <ul>
        <li>First item in an unordered list</li>
        <li>Second item, showing consistent spacing</li>
        <li>Third item
          <ul>
            <li>Nested item one</li>
            <li>Nested item two</li>
          </ul>
        </li>
      </ul>
      <h3>Ordered List</h3>
      <ol>
        <li>First ordered item</li>
        <li>Second ordered item</li>
        <li>Third ordered item</li>
      </ol>
    </div>
  ),
}

export const ArticleContent = {
  render: () => (
    <div className="typeset" style={{ padding: '2rem', maxWidth: '720px' }}>
      <h1>A Sample Article Heading</h1>
      <p className="caption">Posted on 1 January 2025 by Alex Wilson</p>
      <p>
        This story demonstrates the full typeset treatment as applied to article body content. The typography
        system uses a modular scale derived from classic typographic ratios — Major Third at smaller viewports,
        shifting to Perfect Fourth at larger screens.
      </p>
      <h2>A Section Heading</h2>
      <p>
        Headings are set in Helvetica sans-serif with OpenType features enabled where available. Body copy
        uses Georgia serif for readability. <a href="#">Links within paragraphs</a> receive a refined
        underline treatment using background gradients rather than the default text-decoration.
      </p>
      <blockquote>
        <p>Good typography is invisible; it carries the reader without interruption.</p>
      </blockquote>
      <h3>Code and Technical Content</h3>
      <p>
        The design system supports <strong>technical writing</strong> with bold emphasis, <em>editorial
        emphasis in italic</em>, and <small>small captions for supplementary information</small>.
      </p>
      <ul>
        <li>Consistent vertical rhythm throughout</li>
        <li>Baseline grid maintained across all sizes</li>
        <li>OpenType features: ligatures, oldstyle figures, kerning</li>
      </ul>
    </div>
  ),
}

export const TextUtilities = {
  render: () => (
    <div style={{ padding: '2rem', maxWidth: '720px', fontFamily: 'inherit' }}>
      {[
        { cls: 'upper',           label: '.upper',           sample: 'Uppercase with letter-spacing' },
        { cls: 'small-caps',      label: '.small-caps',      sample: 'Small Caps via OpenType' },
        { cls: 'lining-numerals', label: '.lining-numerals', sample: '0123456789 lining numerals' },
        { cls: 'oldstyle-numerals', label: '.oldstyle-numerals', sample: '0123456789 oldstyle numerals' },
      ].map(({ cls, label, sample }) => (
        <div key={cls} style={{ display: 'flex', alignItems: 'baseline', gap: '2rem', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
          <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#888', minWidth: '160px' }}>{label}</span>
          <span className={`typeset ${cls}`}>{sample}</span>
        </div>
      ))}
      <div style={{ marginTop: '2rem' }}>
        <p style={{ fontFamily: 'monospace', fontSize: '12px', color: '#888' }}>Alignment helpers</p>
        <div style={{ border: '1px solid #eee', padding: '0.5rem', marginBottom: '0.5rem' }}>
          <p className="align-left">.align-left — text aligned left</p>
        </div>
        <div style={{ border: '1px solid #eee', padding: '0.5rem', marginBottom: '0.5rem' }}>
          <p className="align-center">.align-center — text aligned centre</p>
        </div>
        <div style={{ border: '1px solid #eee', padding: '0.5rem' }}>
          <p className="align-right">.align-right — text aligned right</p>
        </div>
      </div>
    </div>
  ),
}
