import { markSvg } from '../mark';

// Follows the browser's theme: dark ink on light tabs, light ink on dark ones.
export const GET = () =>
  new Response(
    markSvg({
      ink: '#1d1d1f',
      accent: '#059669',
      pad: -2,
      css: '@media (prefers-color-scheme: dark){.ink{stroke:#f5f5f7}.dot{fill:#34d399}}',
    }),
    { headers: { 'Content-Type': 'image/svg+xml' } },
  );
