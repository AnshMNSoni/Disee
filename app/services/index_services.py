import os
import re

# Global index (in-memory)
INVERTED_INDEX = {}

STORAGE_PATH = os.getenv("STORAGE_PATH", "app/storage")


def tokenize(text: str):
    # Lowercase + remove special chars
    text = text.lower()
    words = re.findall(r'\b\w+\b', text)
    return words


def build_index():
    global INVERTED_INDEX
    INVERTED_INDEX = {}

    for filename in os.listdir(STORAGE_PATH):
        filepath = os.path.join(STORAGE_PATH, filename)

        if not os.path.isfile(filepath):
            continue

        with open(filepath, "r", encoding="utf-8") as file:
            content = file.read()

        words = tokenize(content)

        for word in words:
            if word not in INVERTED_INDEX:
                INVERTED_INDEX[word] = []

            if filename not in INVERTED_INDEX[word]:
                INVERTED_INDEX[word].append(filename)

    print("Index built:", len(INVERTED_INDEX), "words")
