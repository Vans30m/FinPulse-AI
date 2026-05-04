# FinPulse AI: AI-Powered Financial News & Trading Analytics

## Overview
FinPulse AI is a highly scalable financial news platform designed to ingest and analyze unstructured global market data[cite: 1]. By combining a highly responsive Flutter frontend with a decoupled, asynchronous FastAPI backend, the system delivers real-time stock alerts, AI-summarized macroeconomic briefings, and personalized market insights[cite: 1]. The platform is designed to serve retail investors, long-term wealth builders, and institutional analysts[cite: 1].

## Key Features
*   **Real-Time Market Alerts:** Delivers sub-second latency market updates and breaking news via persistent WebSocket connections[cite: 1].
*   **Domain-Specific AI Sentiment Analysis:** Utilizes FinBERT, a model fine-tuned on financial data, to classify news as positive, negative, or neutral[cite: 1].
*   **Conversational RAG Chatbot:** Integrates Retrieval-Augmented Generation to allow users to instantly synthesize SEC filings, earnings call transcripts, and global news[cite: 1].
*   **Personalized Watchlists & Feeds:** Offers custom watchlist monitoring alongside AI-summarized daily briefings[cite: 1].
*   **Regulatory Compliance:** Strictly adheres to SEBI compliance rules by keeping AI from acting as a registered investment advisor and displaying mandatory legal disclaimers[cite: 1].

## Architecture
The platform is built on a microservices architecture to isolate heavy AI inference tasks from general API traffic, ensuring the system scales horizontally[cite: 1]. 

*   **Frontend (Flutter):** Strictly adheres to Clean Architecture using a feature-first folder structure[cite: 1]. It utilizes Riverpod 2.0 for compile-time safe dependency injection and reactive caching[cite: 1]. 
*   **Backend (FastAPI):** Built on ASGI and Pydantic for high-performance asynchronous operations[cite: 1]. It implements Role-Based Access Control (RBAC) and routes traffic through a dedicated API Gateway[cite: 1].
*   **AI Microservices:** Utilizes open-source models (FinBERT) for high-throughput sentiment tasks to minimize latency and cost[cite: 1]. It reserves commercial LLMs (like Claude or Gemini) for complex reasoning tasks within the RAG pipeline[cite: 1].

## Technology Stack
*   **Mobile/Web Framework:** Flutter with Skia/Impeller rendering engines for 60-120fps performance[cite: 1].
*   **Backend Framework:** FastAPI with Python[cite: 1].
*   **Databases:** PostgreSQL (using 3NF normalization and JSONB for AI metadata) and Redis (ultra-fast in-memory caching and Pub/Sub messaging)[cite: 1].
*   **Vector Database:** Pinecone or Weaviate for document embedding storage[cite: 1].
*   **Event Streaming & Real-Time:** Apache Kafka for durable event ingestion and WebSockets for bi-directional client updates[cite: 1].
*   **DevOps & CI/CD:** Docker containerization, GitHub Actions for automated pipelines, and Firebase for scalable push notifications and crash reporting[cite: 1].

## System Scalability
*   **Microservices:** The API gateway, AI inference engines, and WebSocket real-time feeds are heavily decoupled to scale using Kubernetes[cite: 1].
*   **Background Processing:** Heavy computational tasks, such as PDF scraping and invoking FinBERT, are offloaded to a Celery background worker queue[cite: 1].
*   **Database Partitioning:** PostgreSQL implements declarative table partitioning on time-series data to maintain query performance over millions of rows[cite: 1].

## Security & Compliance
*   **Authentication:** Managed via Firebase Auth with biometric (FaceID/Fingerprint) secondary layers required for sensitive actions[cite: 1].
*   **Network Security:** The Flutter Dio client enforces SSL Pinning to thwart Man-In-The-Middle (MITM) attacks[cite: 1]. 
*   **Data Privacy:** Custom analytics tracking anonymizes user IDs to comply with GDPR and Indian DPDP acts[cite: 1]. No Personally Identifiable Information (PII) is passed to external LLM APIs without enterprise data processing agreements[cite: 1].

## Local Development & Setup
*Note: Ensure Docker and `uv` are installed on your host machine before beginning.*

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-org/finpulse-ai.git](https://github.com/your-org/finpulse-ai.git)
    cd finpulse-ai
    ```
2.  **Environment Variables:**
    *   Copy the example environment file and populate your API keys (NewsAPI, AlphaVantage, Pinecone, etc.)[cite: 1].
    ```bash
    cp .env.example .env
    ```
3.  **Start the Backend Services:**
    *   The project uses multi-stage Docker builds to spin up FastAPI, PostgreSQL, Redis, and Kafka[cite: 1].
    ```bash
    docker-compose up --build
    ```
4.  **Run the Flutter Application:**
    *   Navigate to the Flutter directory and run the code generation for Riverpod and Freezed[cite: 1].
    ```bash
    cd frontend
    flutter pub get
    dart run build_runner build --delete-conflicting-outputs
    flutter run --dart-define=ENV=dev
    ```
