# Wordle Extension

A Chrome extension that lets you play Wordle directly from your browser toolbar!

## Features

- 🎮 Classic Wordle gameplay with 6 guesses
- 📊 Statistics tracking (games played, win %, streaks)
- 📅 "Word of the Day" mode that fetches today's official Wordle answer
- ⌨️ On-screen keyboard with accent character support (long-press for accented letters)
- 💾 Game state persists across browser sessions
- 📜 History of past games

## Installation

1. Clone this repository or download the ZIP
2. Open Chrome and navigate to `chrome://extensions`
3. Enable **Developer mode** (toggle in top-right corner)
4. Click **Load unpacked**
5. Select the `wordle-extension` folder

## Usage

- Click the extension icon in your Chrome toolbar to start playing
- Type letters using your keyboard or click the on-screen keyboard
- Press **Enter** to submit a guess
- Press **Backspace** to delete letters
- Click **⟳** to start a new random game
- Click the **calendar icon** to play the official NYT Word of the Day
- Click the **chart icon** to view your statistics

## Files

| File | Description |
|------|-------------|
| `manifest.json` | Chrome extension configuration |
| `popup.html` | Main game UI |
| `popup.css` | Styling for the game |
| `popup.js` | Game logic and interactivity |
| `words.js` | Word list (2000+ 5-letter words) |
| `logic.js` | Core game evaluation logic |
| `analytics.html/css/js` | Standalone analytics page |

## License

MIT
