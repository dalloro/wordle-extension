#!/usr/bin/env python3
"""
Generate comprehensive word list for Wordle extension.
Downloads from known Wordle word sources and filters plurals.
"""
import urllib.request
import os

# Allowed words ending in 'S' (not plurals)
ALLOWED_S_WORDS = {
    "ABYSS", "AEGIS", "ALIAS", "AMASS", "AMISS", "ATLAS", "BASIS", "BLESS",
    "BLISS", "BOGUS", "BONUS", "BRASS", "CLASS", "CHAOS", "CHESS", "CORPS",
    "CRASS", "CRESS", "CROSS", "DRESS", "DROSS", "ETHOS", "FLOSS", "FOCUS",
    "FRIZZ", "GAUSS", "GENUS", "GLASS", "GLOSS", "GRASS", "GROSS", "GUESS",
    "HUMUS", "KUDOS", "LAPIS", "LOCUS", "LOTUS", "LUPUS", "MINUS", "MUCUS",
    "NEXUS", "OASIS", "PARIS", "PENIS", "PIOUS", "PRESS", "REBUS", "SINUS",
    "SWISS", "TORUS", "TRUSS", "VENUS", "VIRUS", "ADIOS", "XERUS",
}


def is_valid_word(word):
    word = word.upper().strip()
    if len(word) != 5:
        return False
    if not word.isalpha():
        return False
    if word.endswith('SS'):
        return True
    if word in ALLOWED_S_WORDS:
        return True
    if word.endswith('S'):
        return False
    return True


def download_words(url):
    try:
        with urllib.request.urlopen(url, timeout=30) as response:
            return response.read().decode('utf-8').splitlines()
    except Exception as e:
        print(f"Error downloading {url}: {e}")
        return []


def main():
    all_words = set()

    # Download from multiple sources
    sources = [
        "https://raw.githubusercontent.com/tabatkins/wordle-list/main/words",
        "https://gist.githubusercontent.com/cfreshman/a03ef2cba789d8cf00c08f767e0fad7b/raw/wordle-answers-alphabetical.txt",
    ]

    for url in sources:
        print(f"Downloading from {url}...")
        words = download_words(url)
        for word in words:
            if is_valid_word(word):
                all_words.add(word.upper().strip())
        print(f"  Found {len(words)} words, {len(all_words)} total valid so far")

    sorted_words = sorted(all_words)
    print(f"\nTotal valid words: {len(sorted_words)}")

    # Generate JavaScript file
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(script_dir, '..', 'words.js')

    with open(output_path, 'w') as f:
        f.write('const WORDS = [\n')
        for i, word in enumerate(sorted_words):
            comma = ',' if i < len(sorted_words) - 1 else ''
            f.write(f'    "{word}"{comma}\n')
        f.write('];\n\n')
        f.write("if (typeof module !== 'undefined') {\n")
        f.write("    module.exports = WORDS;\n")
        f.write("}\n")

    print(f"Generated words.js with {len(sorted_words)} words")
    print(f"Contains PRION: {'PRION' in all_words}")


if __name__ == '__main__':
    main()
