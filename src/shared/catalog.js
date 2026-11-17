/* Theme catalog – shared by the main process (require) and renderer pages (<script>). */
(function (root, factory) {
  const catalog = factory();
  if (typeof module === 'object' && module.exports) module.exports = catalog;
  else root.DD_CATALOG = catalog;
})(typeof self !== 'undefined' ? self : this, function () {
  return {
    themes: [
      {
        id: 'winter',
        name: 'Snowy Village',
        tagline: 'Snowballs roll onto your Dock. Stack them into a snowman and dress it up.',
        accent: '#9fa8ff',
        free: true,
        overlayFull: false,
        action: 'Call Santa’s sleigh',
        scenes: [
          { id: 'night', label: 'Moonlit village' },
          { id: 'golden', label: 'Golden hour' },
          { id: 'cabin', label: 'Cozy cabin' }
        ],
        tips: [
          'Drag a snowball onto another one to stack it',
          'Stack three to build a snowman',
          'Click a snowman to dress it up, double-click to smash it',
          'Click the gifts Santa drops'
        ]
      },
      {
        id: 'wizard',
        name: 'Wizard Academy',
        tagline: 'Floating candles, a moonlit castle, a mail owl and a wand that follows your cursor.',
        accent: '#f4c86a',
        free: false,
        overlayFull: true,
        action: 'Send the owl',
        scenes: [{ id: 'castle', label: 'Castle by the lake' }],
        tips: [
          'Your cursor leaves a trail of sparks',
          'Click the owl to send it off for mail',
          'Click the cauldron to brew a random spell, double-click to blow it up',
          'Double-click the owl to startle it',
          'Right-click the owl or cauldron (or click the book) for the spellbook'
        ]
      },
      {
        id: 'drive',
        name: 'Night Drive',
        tagline: 'A neon city that scrolls past, and a car on your Dock you can paint, fling and launch off ramps.',
        accent: '#ff5fb8',
        free: false,
        overlayFull: false,
        action: 'Go for a cruise',
        scenes: [{ id: 'city', label: 'Neon city' }],
        tips: [
          'Click the car to honk',
          'Throw it at the ramp and watch it flip',
          'Knock over the traffic cones',
          'Double-click the car to blow it up 💥',
          'Right-click the car to open the garage'
        ]
      },
      {
        id: 'ocean',
        name: 'Coral Reef',
        tagline: 'Sun rays, swaying kelp and fish on your Dock that you feed, collect and decorate for.',
        accent: '#38d6e8',
        free: false,
        overlayFull: false,
        action: 'Feed the fish',
        scenes: [{ id: 'reef', label: 'Sunlit reef' }],
        tips: [
          'Click the food shaker to feed your fish',
          'Fish swim away from fast cursor moves',
          'Open the treasure chest to find a new fish',
          'Double-click a fish for a turbo dash, or pop the puffer',
          'Double-click the shaker for a feeding frenzy',
          'Right-click a fish to manage your tank'
        ]
      }
    ],
    get(id) {
      return this.themes.find((t) => t.id === id) || this.themes[0];
    },

    /* ---------------- weather ---------------- */
    weatherTypes: [
      { id: 'auto', label: 'Match the theme', free: true },
      { id: 'season', label: 'Match the season' },
      { id: 'snow', label: 'Snow', free: true },
      { id: 'rain', label: 'Rain' },
      { id: 'blossom', label: 'Cherry blossoms' },
      { id: 'leaves', label: 'Autumn leaves' },
      { id: 'hearts', label: 'Hearts' },
      { id: 'confetti', label: 'Confetti' },
      { id: 'off', label: 'Off', free: true }
    ],
    weatherAmounts: [
      { id: 'light', label: 'Light' },
      { id: 'medium', label: 'Medium' },
      { id: 'heavy', label: 'Heavy' },
      { id: 'blizzard', label: 'Blizzard' }
    ],
    winds: [
      { id: 'calm', label: 'Calm' },
      { id: 'left', label: 'Breeze ←' },
      { id: 'right', label: 'Breeze →' },
      { id: 'gusty', label: 'Gusty' }
    ],
    defaultWeather: { type: 'auto', amount: 'medium', wind: 'calm', paused: false, onWindows: true },
    /* Turns 'auto' / 'season' into a concrete weather type. */
    resolveWeather(type, themeId, date = new Date()) {
      if (type === 'auto') return { winter: 'snow', drive: 'rain', wizard: 'off', ocean: 'off' }[themeId] || 'off';
      if (type === 'season') {
        const m = date.getMonth();
        if (m === 11 || m <= 1) return 'snow';
        if (m <= 4) return 'blossom';
        if (m <= 7) return 'confetti';
        return 'leaves';
      }
      return type || 'off';
    }
  };
});
