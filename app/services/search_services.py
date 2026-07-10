import os
from app.services import index_services

def search(query: str):
    query = query.lower()
    index = index_services.INVERTED_INDEX
    if query in index:
        return index[query]
    return []

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
            "url": url
        })
        
    # Enforce Cache Eviction Policy (max 200 cached files per node)
    evict_old_cache_files(storage_path, max_files=200)
        
    # Rebuild the inverted index on-the-fly to include new cached documents
    try:
        index_services.build_index()
    except Exception as e:
        print(f"Error rebuilding index on node {node_id}: {e}")
        
    return matched
