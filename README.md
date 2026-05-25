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

*   **Frontend :** S
*   **Backend (FastAPI):** 
*   **AI Microservices:** Utilizes open-source models (FinBERT) for high-throughput sentiment tasks to minimize latency and cost[cite: 1]. It reserves commercial LLMs (like Claude or Gemini) for complex reasoning tasks within the RAG pipeline[cite: 1].

## Technology Stack





## System Scalability
*   **Microservices:** The API gateway, AI inference engines, and WebSocket real-time feeds are heavily decoupled to scale using Kubernetes[cite: 1].
*   **Background Processing:** Heavy computational tasks, such as PDF scraping and invoking FinBERT, are offloaded to a Celery background worker queue[cite: 1].
*   **Database Partitioning:** PostgreSQL implements declarative table partitioning on time-series data to maintain query performance over millions of rows[cite: 1].

## Security & Compliance
*   **Authentication:** Managed via Firebase Auth with biometric (FaceID/Fingerprint) secondary layers required for sensitive actions[cite: 1].
*   **Network Security:** The Flutter Dio client enforces SSL Pinning to thwart Man-In-The-Middle (MITM) attacks[cite: 1]. 
*   **Data Privacy:** Custom analytics tracking anonymizes user IDs to comply with GDPR and Indian DPDP acts[cite: 1]. No Personally Identifiable Information (PII) is passed to external LLM APIs without enterprise data processing agreements[cite: 1].
