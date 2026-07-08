<div align='center'>
    <img width="1774" height="887" alt="Disee" src="https://github.com/user-attachments/assets/5ea1045e-795d-451b-9817-44ea3dd0bee9" />
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

## ✨ Key Features

- **Distributed Query Aggregation**: The Gateway service fans out processed data chunks to all active worker nodes in parallel.
- **Dynamic Multi-Source Integration**: Real-time fetching from Wikipedia and StackOverflow APIs for up-to-date information.
- **Distributed Result Processing**: Nodes act as distributed processors, enriching and attributing dynamic content chunks.
- **Premium Minimal UI**: A Google-inspired, immersive frontend with smooth motion design, focus-aware dimming, and elegant typography.
- **Asynchronous I/O**: Heavy use of `httpx` and `asyncio` for non-blocking concurrent node communication.
- **Dockerized Environment**: Fully containerized setup for consistent development and deployment.
- **FastAPI OpenAPI Integration**: Interactive API documentation available out-of-the-box.

## 🛠️ Tech Stack

- **Language**: Python 3.9+
- **Web Framework**: [FastAPI](https://fastapi.tiangolo.com/)
- **Frontend**: [React](https://reactjs.org/), [Tailwind CSS](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/)
- **ASGI Server**: [Uvicorn](https://www.uvicorn.org/)
- **HTTP Client**: [HTTPX](https://www.python-httpx.org/) (for asynchronous node calls)
- **Containerization**: [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)
- **Data Sourcing**: Wikipedia API & StackOverflow (StackExchange) API.

## 🚀 Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.
- [Python 3.9+](https://www.python.org/downloads/) (for local development, optional).

### Quick Launch

1.  **Clone/Fork the Repository**:
    ```bash
    git clone https://github.com/AnshMNSoni/Distributive-Search-Engine.git
    cd Distributive-Search-Engine
    ```

2.  **Spin up the Cluster**:
    ```bash
    docker-compose up --build
    ```

3.  **Access the Search API**:
    - **Gateway Search**: `http://localhost:8000/search?q=your_keyword`
    - **Interactive API Docs (Swagger UI)**: `http://localhost:8000/docs/`

4. **UI Experience**:
    ```sh
    cd frontend
    ```
    ```sh
    npm install
    ```
    ```sh
    npm run dev
    ```

## 📋 Current Scope & Roadmap

- [x] Phase 1: Standalone Indexing & Search
- [x] Phase 2: Dockerized Multi-Node Aggregation
- [x] Phase 3: Dynamic Wikipedia & StackOverflow Integration
- [x] Feature: Premium Google-like UI with immersive animations
- [x] Feature: Distributed Processing Workers
- [ ] Feature: Dynamic Node Registration & Heartbeats
- [ ] Feature: Fault-tolerant Querying (Handle node timeouts gracefully)

## 📊 Performance Benchmarks

To optimize query duration, the Gateway uses non-blocking asynchronous calls (`httpx` and `asyncio.gather`). The table below outlines typical empirical latencies observed in sequential vs. concurrent query routing:

| Search Step | Synchronous (Sequential) Latency | Asynchronous (Concurrent) Latency |
| :--- | :--- | :--- |
| Wikipedia API Query | 350ms | 350ms |
| StackOverflow API Query | 420ms | 420ms *(concurrent with Wikipedia)* |
| Worker Node 1 Processing | 120ms | 120ms |
| Worker Node 2 Processing | 150ms | 150ms *(concurrent with Node 1)* |
| Worker Node 3 Processing | 110ms | 110ms *(concurrent with Node 1)* |
| **Total Query Duration** | **1150ms** | **570ms (50.4% Latency Reduction)** |

### Basis of Latency Calculations
1. **Synchronous Latency**: Sum of all sequential network calls:
   $$T_{\text{sync}} = 350\text{ms} + 420\text{ms} + 120\text{ms} + 150\text{ms} + 110\text{ms} = 1150\text{ms}$$
2. **Asynchronous Latency**: Calculated by parallel execution blocks:
   * External APIs: $T_{\text{APIs}} = \max(350\text{ms}, 420\text{ms}) = 420\text{ms}$
   * Worker Nodes: $T_{\text{Workers}} = \max(120\text{ms}, 150\text{ms}, 110\text{ms}) = 150\text{ms}$
   * Total async latency: $T_{\text{async}} = T_{\text{APIs}} + T_{\text{Workers}} = 420\text{ms} + 150\text{ms} = 570\text{ms}$

---

## ❓ Myths & Common Misconceptions

* **Myth 1: "Since the backend is written in FastAPI with Docker, the cluster is automatically production-grade."**
  * *Reality*: Docker and FastAPI provide routing and orchestration, but the system is a local development demonstration. It lacks enterprise-level elements like service meshes, dynamic cluster discovery nodes, query routers, and replication policies.
* **Myth 2: "Dynamic search query partitioning is a form of MapReduce."**
  * *Reality*: This is a Scatter-Gather pattern. While MapReduce performs batch splits across large datasets, the Gateway coordinates live API lookups and fans out chunk routing to worker nodes.
* **Myth 3: "An in-memory postings dictionary is always superior to database search indexes."**
  * *Reality*: Lookups are extremely fast ($\mathcal{O}(1)$ average), but they consume system memory and require index construction on container startup. A production search engine (like Lucene) utilizes segment caching and virtual memory to manage large datasets.
* **Myth 4: "The database is secure since worker containers are isolated on a private Docker bridge network."**
  * *Reality*: Isolation protects worker containers from direct internet access, but input queries must still be validated on the Gateway to prevent text injection or resource exhaustion.

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
