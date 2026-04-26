# 🔍 Distributed Search Engine (DSE)

[![Python](https://img.shields.io/badge/Python-3.9%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Framework-009688.svg)](https://fastapi.tiangolo.com/)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED.svg)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A high-performance, containerized, distributed search engine built with **FastAPI** and **Docker**. This project implements a scalable architecture for dynamically fetching results from external sources (Wikipedia, StackOverflow), partitioning the data into chunks, and distributing them across multiple worker nodes for parallel processing and aggregation.

## 🏗️ System Architecture

The project is structured around a **Gateway-Worker** pattern. The central Gateway fetches real-time data from external APIs (Wikipedia, StackOverflow), partitions the content, and distributes it to multiple worker nodes that process and attribute the data in parallel.

### Phase 1: Single Node (Single Machine)
Initial implementation focused on a standalone node managing its own inverted index and search logic.
<img width="2666" height="789" alt="Phase 1 Architecture" src="https://github.com/user-attachments/assets/28582eae-239a-4eca-b22a-3de9b402c8ce" />

### Phase 2: Multiple Nodes (Single Machine)
Introduction of the **Gateway Service**, which orchestrates search queries across multiple containers running on the same host via Docker Compose.
<img width="4575" height="2250" alt="Phase 2 Architecture" src="https://github.com/user-attachments/assets/b5ed6131-f783-42fb-9953-2f4b3630cdc6" />

### Phase 3: Distributed Cluster (Ongoing 🚀)
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
