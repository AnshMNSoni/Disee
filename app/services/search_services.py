from app.services import index_services


def search(query: str):
    query = query.lower()
    
    index = index_services.INVERTED_INDEX

    if query in index:
        return index[query]

    return []
