import os
import re
import json
from collections import defaultdict

# Global advanced index structure
# Format: { stream_type: { word: { filename: frequency } } }
INVERTED_INDEX = {
    "prose": defaultdict(dict),
    "code": defaultdict(dict)
}

# Metadata store to keep track of upvotes, edits, and structural links
# Format: { filename: { "score": int, "links": set() } }
METADATA_STORE = {}

NODE_ID = os.getenv("NODE_ID", "node1")
STORAGE_MAP = {
    "node1": "app/storage_node1",
    "node2": "app/storage_node2",
    "node3": "app/storage_node3",
}
STORAGE_PATH = STORAGE_MAP[NODE_ID]

STOP_WORDS = {"the", "is", "at", "which", "on", "and", "a", "an", "to", "in", "of", "for", "it", "that", "this"}

def tokenize_prose(text: str) -> list[str]:
    """Cleans and tokenizes natural language text."""
    text = text.lower()
    words = re.findall(r'\b\w+\b', text)
    return [w for w in words if w not in STOP_WORDS]

def tokenize_code(text: str) -> list[str]:
    """Tokenizes code, preserving symbols like snake_case, camelCase, and methods."""
    text = text.lower()
    # Captures words including underscores, dots, or hyphens (e.g., 'str.replace', 'user_id')
    words = re.findall(r'\b\w+(?:[._-]\w+)*\b', text)
    return words

def parse_document(content: str):
    """
    Parses a hybrid Wiki/StackOverflow document.
    Expects data format containing: text, upvotes/edits, and related links.
    """
    try:
        # Assuming JSON format for complex Wiki/SO data structures
        data = json.loads(content)
        body = data.get("body", "")
        score = int(data.get("score", 0))  # Upvotes or Edit count
        links = set(data.get("links", [])) # Hyperlinks or related question IDs
    except json.JSONDecodeError:
        # Fallback to raw text if files are plain text
        body = content
        score = 0
        links = set()

    # Separate Code Blocks from Prose Blocks using markdown ``` or HTML <code>
    md_code_blocks = re.findall(r'```(?:[a-zA-Z]*)\n(.*?)\n```', body, re.DOTALL)
    html_code_blocks = re.findall(r'<code>(.*?)</code>', body, re.DOTALL)
    code_blocks = md_code_blocks + html_code_blocks

    # Remove code blocks to leave clean prose text
    prose_body = re.sub(r'```(?:[a-zA-Z]*)\n(.*?)\n```', '', body, flags=re.DOTALL)
    prose_body = re.sub(r'<code>(.*?)</code>', '', prose_body, flags=re.DOTALL)

    # Process prose tokens
    prose_tokens = tokenize_prose(prose_body)
    
    # Process code tokens from explicit code blocks
    code_tokens = []
    for block in code_blocks:
        code_tokens.extend(tokenize_code(block))

    # If no code blocks found, also run code tokenizer on the full body
    # so technical terms (snake_case, dots, hyphens) are captured
    if not code_tokens:
        code_tokens = tokenize_code(body)

    return prose_tokens, code_tokens, score, links

def build_index():
    global INVERTED_INDEX, METADATA_STORE
    INVERTED_INDEX = {"prose": defaultdict(dict), "code": defaultdict(dict)}
    METADATA_STORE = {}

    if not os.path.exists(STORAGE_PATH):
        print(f"Error: Path {STORAGE_PATH} not found.")
        return

    for filename in os.listdir(STORAGE_PATH):
        filepath = os.path.join(STORAGE_PATH, filename)
        if not os.path.isfile(filepath):
            continue

        try:
            with open(filepath, "r", encoding="utf-8") as file:
                content = file.read()
                
            prose_tokens, code_tokens, score, links = parse_document(content)

            # Store file meta details for ranking phases
            METADATA_STORE[filename] = {
                "score": score,
                "links": links
            }

            # Map Prose Index
            for word in prose_tokens:
                INVERTED_INDEX["prose"][word][filename] = INVERTED_INDEX["prose"][word].get(filename, 0) + 1

            # Map Code Index 
            for word in code_tokens:
                INVERTED_INDEX["code"][word][filename] = INVERTED_INDEX["code"][word].get(filename, 0) + 1

        except Exception as e:
            print(f"Failed parsing {filename}: {e}")

    print(f"Dual Index Ready. Unique Prose: {len(INVERTED_INDEX['prose'])}, Unique Code: {len(INVERTED_INDEX['code'])}")

