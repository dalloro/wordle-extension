const Logic = {
    evaluateGuess: (guess, target) => {
        const result = new Array(5).fill('absent');
        const targetLetters = target.split('');
        const guessLetters = guess.split('');

        // First pass: Correct letters (Green)
        guessLetters.forEach((letter, i) => {
            if (letter === targetLetters[i]) {
                result[i] = 'correct';
                targetLetters[i] = null; // Mark as used
                guessLetters[i] = null;
            }
        });

        // Second pass: Present letters (Yellow)
        guessLetters.forEach((letter, i) => {
            if (letter && targetLetters.includes(letter)) {
                result[i] = 'present';
                targetLetters[targetLetters.indexOf(letter)] = null; // Mark as used
            }
        });

        return result;
    },

    extractWordFromHTML: (html) => {
        // Look for "Drumroll, please... it's [WORD]" pattern
        // The word is usually in uppercase, but we should be flexible
        // Based on the example: "Drumroll, please 🥁 it's WAIST."
        // We allow different types of dashes, optional spaces, and smart quotes
        const regex = /Drumroll, please\s*[—–-]?\s*it['’]s\s*([A-Z]+)/i;
        const match = html.match(regex);
        if (match && match[1]) {
            return match[1].toUpperCase();
        }

        // Fallback: Try looking for "Wordle answer is [WORD]" or similar if needed
        // But for now, let's just return null and let the caller log the failure
        return null;
    }
};

if (typeof module !== 'undefined') {
    module.exports = Logic;
}