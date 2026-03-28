import os
import re

# Global index (in-memory)
INVERTED_INDEX = {}

NODE_ID = os.getenv("NODE_ID", "node1")

STORAGE_MAP = {
    "node1": "app/storage_node1",
    "node2": "app/storage_node2",
    "node3": "app/storage_node3",
}

STORAGE_PATH = STORAGE_MAP[NODE_ID]


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
