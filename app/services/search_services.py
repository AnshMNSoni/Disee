from app.services import index_services

def search(query: str):
    query = query.lower()
    
    index = index_services.INVERTED_INDEX
from app.services import index_services

def search(query: str):
    query = query.lower()
    
    index = index_services.INVERTED_INDEX

    if query in index:
        return index[query]

    return []

def process_wiki_chunk(query: str, content: list):
    """
    Simulate distributed processing/search on a chunk of dynamic remote content.
    Each node enriches its portion of data with attribution and returns the processed results.
    """
    matched = []
    node_id = index_services.NODE_ID
    
    for item in content:
        title = item.get("title", "")
        snippet = item.get("snippet", "")
        url = item.get("url", "")
        ext_source = item.get("external_source", "Remote API")
            
        matched.append({
            "source": f"{ext_source} (Processed by {node_id})",
            "title": title,
            "summary": snippet,
            "url": url
        })
        
    return matched
