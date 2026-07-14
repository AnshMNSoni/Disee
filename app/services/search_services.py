import os
from app.services import index_services
from collections import defaultdict

<<<<<<< HEAD
def search(query: str, search_mode: str = "prose") -> list[dict]:
    """
    Advanced search with quality scoring weights.
    search_mode can be 'prose' or 'code'.
    """
    # Select target token stream based on intent
    tokens = index_services.tokenize_code(query) if search_mode == "code" else index_services.tokenize_prose(query)
    if not tokens:
        return []

    raw_scores = defaultdict(float)
    target_index = index_services.INVERTED_INDEX.get(search_mode, {})

    # Step 1: Calculate raw keyword match frequency
    for word in tokens:
        if word in target_index:
            for filename, freq in target_index[word].items():
                raw_scores[filename] += freq

    final_rankings = []
    # Step 2: Apply the Social Boost Multiplier
    for filename, text_score in raw_scores.items():
        meta = index_services.METADATA_STORE.get(filename, {"score": 0, "links": set()})
        
        # Logarithmic scaling prevents high upvote numbers from skewing results completely
        # Ensures a file with 1000 upvotes doesn't destroy a perfect text match with 5 upvotes
        social_boost = 1.0 + (meta["score"] / (100.0 + meta["score"])) 
        
        final_score = text_score * social_boost
        final_rankings.append({
            "source": f"Local Storage ({index_services.NODE_ID})",
            "title": filename,
            "summary": f"Keyword Frequency Score: {text_score}. Metadata Score (upvotes/edits): {meta['score']}. Links: {list(meta['links'])}",
            "score": round(final_score, 2),
            "url": ""
        })

    # Sort descending by calculated score
    return sorted(final_rankings, key=lambda x: x["score"], reverse=True)
=======
def search(query: str):
    query = query.lower()
    index = index_services.INVERTED_INDEX
    if query in index:
        return index[query]
    return []
>>>>>>> upstream/main

def evict_old_cache_files(storage_path: str, max_files: int = 200):
    """
    Ensure the number of cached files in the storage folder does not exceed max_files.
    Evicts the oldest files if the limit is exceeded (FIFO).
    """
    try:
        files = [
            os.path.join(storage_path, f)
            for f in os.listdir(storage_path)
            if os.path.isfile(os.path.join(storage_path, f)) and f.endswith("_cache.txt")
        ]
        
        if len(files) > max_files:
            # Sort files by modification time (oldest first)
            files.sort(key=os.path.getmtime)
            
            # Delete the oldest files to bring count back under the limit
            num_to_delete = len(files) - max_files
            for i in range(num_to_delete):
                os.remove(files[i])
                print(f"Evicted old cache file: {files[i]}")
    except Exception as e:
        print(f"Error evicting old cache files: {e}")

def process_wiki_chunk(query: str, content: list):
    """
    Ingest dynamic Wikipedia/StackOverflow search results, write them to local
    disk storage, and dynamically rebuild the inverted index on-the-fly.
    """
    matched = []
    node_id = index_services.NODE_ID
    storage_path = index_services.STORAGE_PATH
    
    for item in content:
        title = item.get("title", "")
        snippet = item.get("snippet", "")
        url = item.get("url", "")
        ext_source = item.get("external_source", "Remote API")
            
        # Clean title to create a safe filename
        safe_title = "".join(c for c in title if c.isalnum() or c in (' ', '_', '-')).strip()
        filename = f"{safe_title.replace(' ', '_').lower()}_cache.txt"
        filepath = os.path.join(storage_path, filename)
        
        # Cache the document to local disk
        try:
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(f"Title: {title}\nSource: {ext_source}\nURL: {url}\nContent: {snippet}")
        except Exception as e:
            print(f"Error caching document to node {node_id}: {e}")
            
        matched.append({
            "source": f"{ext_source} (Processed by {node_id})",
            "title": title,
            "summary": snippet,
            "url": url,
            "score": 1.0  # Fallback score for remote API
        })
        
    # Enforce Cache Eviction Policy (max 200 cached files per node)
    evict_old_cache_files(storage_path, max_files=200)
        
    # Rebuild the inverted index on-the-fly to include new cached documents
    try:
        index_services.build_index()
    except Exception as e:
        print(f"Error rebuilding index on node {node_id}: {e}")
        
    return matched

