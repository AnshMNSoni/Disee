from app.services import index_services
from collections import defaultdict

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
            "url": url,
            "score": 1.0  # Fallback score for remote API
        })
        
    return matched

