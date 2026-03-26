// Inline script to set theme before first paint — prevents flash of wrong theme
export function ThemeScript() {
  const script = `
    (function() {
      var t = localStorage.getItem('theme');
      var d = t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches);
      if (d) document.documentElement.classList.add('dark');
    })();
  `;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: script }}
      suppressHydrationWarning
    />
  );
}
