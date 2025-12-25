#!/usr/bin/env python3
"""
Generate comprehensive 7-letter word list for Christmas Wordle mode.
"""
import urllib.request
import os

# Allowed words ending in 'S' (not plurals)
ALLOWED_S_WORDS = {
    "ACTRESS", "ADDRESS", "COMPASS", "CONFESS", "CONGRESS", "EXPRESS", "FITNESS",
    "GODDESS", "HARNESS", "IMPRESS", "POSSESS", "PROCESS", "PROFESS", "PROGRESS",
    "SUCCESS", "SURPLUS", "WITNESS", "ABSCESS", "ACTRESS", "ANXIOUS", "ARIOUS",
    "BILIOUS", "CALLOUS", "CANVASS", "CASEOUS", "COPIOUS", "CURIOUS", "DEVIOUS",
    "DUBIOUS", "ENVIOUS", "ESTROUS", "FERROUS", "FIBROUS", "FURIOUS", "GASEOUS",
    "HABITUS", "HEINOUS", "HUMDRUM", "JEALOUS", "LUSTROUS", "NERVOUS", "OBVIOUS",
    "OMINOUS", "OSSEOUS", "PAPYRUS", "PARLOUS", "PARVUS", "PITEOUS", "POMPOUS",
    "RAUCOUS", "RIOTOUS", "SERIOUS", "SINUOUS", "TEDIOUS", "TENUOUS", "TETANUS",
    "THYRSUS", "TIMPANI", "TINNIES", "UTERUS", "VACUOUS", "VARIOUS", "VICIOUS",
    "VISCOUS", "ZEALOUS", "AMADEUS", "CELSIUS", "EXODUS", "FAMOUS", "GENIUS",
    "HIBISCUS", "IGNEOUS", "JEALOUS", "NUCLEUS", "OBVIOUS", "PEGASUS", "QUIETUS",
    "RADIUS", "SANCTUS", "SURPLUS", "THESEUS", "URANUS", "VISCOUS", "WALRUS",
    "OMNIBUS", "EMERITUS", "CANNABIS", "CAMPUS", "CACTUS", "CENSUS", "CITRUS",
    "CHORUS", "CIRCUS", "CUMULUS", "CYPRESS", "DISCUSS", "DISMISS", "DISTRESS",
    "DURESS", "EARLESS", "EYELESS", "FATUOUS", "FERROUS", "HARNESS", "HAPLESS",
    "HEINOUS", "HIRSUTE", "HOSTESS", "ILLNESS", "IMPRESS", "INGRESS", "KINDNESS",
    "MADNESS", "MARQUIS", "MATTRESS", "NEMESIS", "ONEROUS", "PAPYRUS", "PEGASUS",
    "PLEXUS", "POROUS", "REPRESS", "SADNESS", "SERIOUS", "SIMIOUS", "SPINOUS",
    "STATUS", "STYPTIC", "SURPLUS", "SYPHILIS", "TEDIOUS", "TEMPEST", "TERTIUS",
    "THALLUS", "THYROID", "TIGRESS", "TIMEOUS", "TRICEPS", "TROPICS", "TUMULUS",
    "TYMPANI", "TYPHOUS", "UKULELE", "ULCEROUS", "UMBROUS", "UNCINUS", "UNDRESS",
    "UNGUESS", "UNICUSS", "UPBRAID", "UPRAISE", "UPWARDS", "UTERINE", "UTOPIAS",
    "VACUOUS", "VALGUS", "VALOROUS", "VAPOURS", "VARIOUS", "VELVETS", "VENDEES",
    "VENOUS", "VENTOUS", "VERDANT", "VERBOSE", "VERMINS", "VIBRIOS", "VICIOUS",
    "VICTORS", "VIDIMUS", "VIGOURS", "VILNIUS", "VISCOUS", "WITNESS",
}


def is_valid_word(word):
    word = word.upper().strip()
    if len(word) != 7:
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
        with urllib.request.urlopen(url, timeout=60) as response:
            return response.read().decode('utf-8').splitlines()
    except Exception as e:
        print(f"Error downloading {url}: {e}")
        return []


def main():
    all_words = set()

    # Download from word list sources
    sources = [
        "https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt",
        "https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-no-swears.txt",
    ]

    for url in sources:
        print(f"Downloading from {url}...")
        words = download_words(url)
        count = 0
        for word in words:
            if is_valid_word(word):
                all_words.add(word.upper().strip())
                count += 1
        print(f"  Found {count} valid 7-letter words")

    sorted_words = sorted(all_words)
    print(f"\nTotal valid 7-letter words: {len(sorted_words)}")

    # Generate JavaScript file
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(script_dir, '..', 'words7.js')

    with open(output_path, 'w') as f:
        f.write('const WORDS7 = [\n')
        for i, word in enumerate(sorted_words):
            comma = ',' if i < len(sorted_words) - 1 else ''
            f.write(f'    "{word}"{comma}\n')
        f.write('];\n\n')
        f.write("if (typeof module !== 'undefined') {\n")
        f.write("    module.exports = WORDS7;\n")
        f.write("}\n")

    print(f"Generated words7.js with {len(sorted_words)} words")
    
    # Show some sample words
    samples = [w for w in sorted_words if w.startswith('CH')][:10]
    print(f"Sample Christmas-ish words: {samples}")


if __name__ == '__main__':
    main()
