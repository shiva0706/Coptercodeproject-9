/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#2A2118',        // brewed-ink brown-black for text
        paper: '#F7F0DE',      // cream notebook page
        kraft: '#DCC9A0',      // kraft-paper outer background
        coffee: '#4A3624',     // deeper vintage brown, used for the home page cover
        scripta: '#3F6659',    // signature deep pine - the "twine" that threads platforms
        scriptaDeep: '#294439',
        moss: '#5C7A52',       // published/success stamp ink
        clay: '#8C3A3A',       // failed/warning stamp ink (oxblood)
        tape: '#D6A756',       // mustard washi tape / scheduled accent
        blush: '#C98A93',      // dusty rose - floral/sticker accent
        line: '#C9B48C',       // hairline dividers, torn-edge tone
      },
      fontFamily: {
        script: ['"Mrs Saint Delafield"', 'cursive'],       // elegant wordmark / hero
        serifDisplay: ['"Playfair Display"', 'serif'],      // bold homepage headings
        display: ['"Caveat"', '"Segoe Script"', 'cursive'], // in-app page headers
        label: ['"Kalam"', '"Segoe Script"', 'cursive'],    // stamps, tags, nav
        body: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      rotate: {
        '1.5': '1.5deg',
        '-1.5': '-1.5deg',
        '2.5': '2.5deg',
        '-2.5': '-2.5deg',
      },
    },
  },
  plugins: [],
};
