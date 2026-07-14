<div style="display: flex; justify-content: center;">
  <img src="https://github.com/user-attachments/assets/cbc15cd7-0fe3-4401-9c6e-4aaed4604503"  alt="Desi" style="max-width: 100%; height: auto;" />
</div>

# 🔍 Distributed Search Engine (DSE)

[![Python](https://img.shields.io/badge/Python-3.9%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Framework-009688.svg)](https://fastapi.tiangolo.com/)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED.svg)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A high-performance, containerized, distributed search engine built with **FastAPI** and **Docker**. This project implements a scalable architecture for dynamically fetching results from external sources (Wikipedia, StackOverflow), partitioning the data into chunks, and distributing them across multiple worker nodes for parallel processing and aggregation.

## 🏗️ System Architecture

<img width="1536" height="1024" alt="disee-gateway-worker architecture" src="https://github.com/user-attachments/assets/d970722d-5a61-4b1f-9e17-210fb76ab853" />
<br>

The project is structured around a **Gateway-Worker** pattern. The central Gateway fetches real-time data from external APIs (Wikipedia, StackOverflow), partitions the content, and distributes it to multiple worker nodes that process and attribute the data in parallel.

### Phase 1: Single Node (Single Machine)
Initial implementation focused on a standalone node managing its own inverted index and search logic.
<img width="2666" height="900" alt="Phase 1 Architecture" src="https://github.com/user-attachments/assets/28582eae-239a-4eca-b22a-3de9b402c8ce" />

### Phase 2: Multiple Nodes (Single Machine)
Introduction of the **Gateway Service**, which orchestrates search queries across multiple containers running on the same host via Docker Compose.
<img width="4575" height="2250" alt="Phase 2 Architecture" src="https://github.com/user-attachments/assets/b5ed6131-f783-42fb-9953-2f4b3630cdc6" />

### Phase 3: Static Nodes (Multiple Machine) (Currently 3 static nodes)
The goal of Phase 3 is to achieve full distribution across multiple physical or virtual machines, implementing more resilient discovery and load balancing.
<img width="1205" height="646" alt="Phase 3 Architecture" src="https://github.com/user-attachments/assets/e6301534-907d-4e79-bee7-03eadee51aed" />

## ✨ Key Features & Optimizations

### 1. Dual-Stream Tokenization (Code vs. Prose)
* **Files**: `index_services.py`
* **Mechanism**: During startup document indexing, text content is concurrently tokenized into two distinct streams:
  | Stream | Tokenizer | Behavior | Example |
  | :--- | :--- | :--- | :--- |
  | **Prose** | `tokenize_prose()` | Extracts clean alpha-numeric terms, discarding common stop words (`the`, `is`, `at`, etc.) | `"python scripting"` → `["python", "scripting"]` |
  | **Code** | `tokenize_code()` | Retains programming syntax characters like underscores, dots, and hyphens | `"user_id str.replace"` → `["user_id", "str.replace"]` |
* **Advantage**: Standard prose tokenizers split code elements like `ctx.execute()` into generic `ctx` and `execute` tokens, losing technical context. Keeping syntax structures intact ensures precise search matching on exact API references and variable names.

### 2. Metadata-Weighted Scoring (Social Boost)
* **Files**: `search_services.py`, `index_services.py`
* **Mechanism**: Documents are enriched with interactive metadata (such as upvote and edit counts). Results are ranked dynamically based on this logarithmic scoring system:
  $$\text{final\_score} = \text{text\_match\_score} \times \left(1 + \frac{\text{score}}{100 + \text{score}}\right)$$
* **Advantage**: This ensures highly upvoted/established answers receive a logarithmic authority boost over low-quality matches, prioritizing proven solutions without letting authority overshadow query relevance.
  * *5 upvotes* $\rightarrow$ ~5% boost
  * *100 upvotes* $\rightarrow$ ~50% boost
  * *10,000 upvotes* $\rightarrow$ ~99% boost (caps gracefully)

### 3. Source-Aware Search Modes
* **Files**: `gateway/main.py`, [App.jsx](file:///c:/Users/Prince%20Patel/Desktop/Projects/Disee/Disee/frontend/src/App.jsx)
* **Mechanism**: The user interface supports three query filters that map cleanly to targeted datasets:
  | Mode | External APIs | Local Index |
  | :--- | :--- | :--- |
  | 🌐 **All** *(Default)* | Wikipedia + StackOverflow | Prose Index |
  | 📖 **Wikipedia** | Wikipedia Only | Prose Index |
  | 💻 **StackOverflow** | StackOverflow Only | Code Index |
* **Advantage**: Fine-tunes performance and output quality. Conceptual queries use Wikipedia indices, whereas technical queries target code token streams from StackOverflow.

### 4. Distributed Processing of External Results
* **Files**: `gateway/main.py`
* **Mechanism**: Real-time Wikipedia/StackOverflow responses are split into chunks and distributed asynchronously across active background worker nodes for parallel metadata enrichment and attribution.
* **Advantage**: Simulates horizontal scaling on clusters, unloading query parsing bottlenecks from the central gateway to compute nodes.

### 5. Startup Index Building
* **Files**: `main.py`
* **Mechanism**: Scans internal storage folders on node boot-up and automatically structures the code and prose inverted indexes in-memory (`build_index()`).
* **Advantage**: Replaces manual index triggers; the cluster is search-ready the moment servers boot.

### 6. Premium Responsive Light UI
* **Files**: [App.jsx](file:///c:/Users/Prince%20Patel/Desktop/Projects/Disee/Disee/frontend/src/App.jsx), [index.css](file:///c:/Users/Prince%20Patel/Desktop/Projects/Disee/Disee/frontend/src/index.css), [LogoAnimation.jsx](file:///c:/Users/Prince%20Patel/Desktop/Projects/Disee/Disee/frontend/src/LogoAnimation.jsx), [MatrixBackground.jsx](file:///c:/Users/Prince%20Patel/Desktop/Projects/Disee/Disee/frontend/src/MatrixBackground.jsx)
* **Mechanism**: Features a premium light Wedgwood blue and cream theme.
  * Includes a background canvas displaying animated colliding nodes and binary streams.
  * Incorporates a `.webm` intro animation that plays dynamically on page load before cross-fading into the static brand logo.
  * Uses premium glassmorphic frosted-blur overlays behind form inputs and results.
  * Disables user-drag and selections on visual assets to preserve brand styling integrity.

---

## 🛠️ Tech Stack

- **Language**: Python 3.9+
- **Web Framework**: [FastAPI](https://fastapi.tiangolo.com/)
- **Frontend**: [React](https://reactjs.org/), [Tailwind CSS](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/)
- **ASGI Server**: [Uvicorn](https://www.uvicorn.org/)
- **HTTP Client**: [HTTPX](https://www.python-httpx.org/) (for asynchronous node calls)
- **Containerization**: [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)
- **Data Sourcing**: Wikipedia API & StackOverflow (StackExchange) API.

---

## 🚀 Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.
- [Node.js](https://nodejs.org/) (v16+) and [Python 3.9+](https://www.python.org/downloads/) (for local development).

### Quick Launch

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/AnshMNSoni/Distributive-Search-Engine.git
   cd Distributive-Search-Engine
   ```

2. **Spin up the Cluster**:
   ```bash
   docker-compose up --build
   ```

3. **Access the Search API**:
   - **Gateway Search**: `http://localhost:8000/search?q=your_keyword`
   - **Interactive API Docs (Swagger UI)**: `http://localhost:8000/docs/`

4. **UI Experience**:
   ```sh
   cd frontend
   npm install
   npm run dev
   ```

---

## 📋 Current Scope & Roadmap

- [x] Phase 1: Standalone Indexing & Search
- [x] Phase 2: Dockerized Multi-Node Aggregation
- [x] Phase 3: Dynamic Wikipedia & StackOverflow Integration
- [x] Feature: Premium Light UI with interactive collision-matrix background
- [x] Feature: Startup Auto-indexing & Dual-Stream Tokenizers
- [x] Feature: Logarithmic Social Boost Metadata Ranking
- [ ] Feature: Dynamic Node Registration & Heartbeats
- [ ] Feature: Fault-tolerant Querying (Handle node timeouts gracefully)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request or open an issue for any bug reports or feature requests.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🟢 Active Contributors

![Contributors](https://contrib.rocks/image?repo=AnshMNSoni/Disee)

## 📜 License

This project is licensed under the [MIT License](LICENSE).
