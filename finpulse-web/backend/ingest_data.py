import os
import psycopg
from google import genai
from google.genai import types  # Imported to configure vector sizing
from dotenv import load_dotenv

print("▶️ Script initialized...")

# Load credentials from .env file
load_dotenv()

db_url = os.getenv("DATABASE_URL")
gemini_key = os.getenv("GEMINI_API_KEY")

print(f"Checking environment variables...")
print(f"Database URL found: {True if db_url else False}")
print(f"Gemini Key found: {True if gemini_key else False}")

def upload_to_neon(ticker, doc_name, text_chunk):
    print(f"🔄 Contacting Google Gemini for embedding...")
    client = genai.Client(api_key=gemini_key)
    
    # Generate the vector and explicitly force it to 1536 dimensions
    res = client.models.embed_content(
        model="gemini-embedding-001",
        contents=text_chunk,
        config=types.EmbedContentConfig(output_dimensionality=1536)
    )
    embedding = res.embeddings[0].values
    print(f"✅ Embedding generated successfully! (Dimensions: {len(embedding)})")

    print(f"📦 Connecting to Cloud Neon Database...")
    with psycopg.connect(db_url) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO financial_knowledge_base (ticker, source_document, content_chunk, embedding)
                VALUES (%s, %s, %s, %s);
                """,
                (ticker, doc_name, text_chunk, embedding)
            )
            conn.commit()
    print("🚀 SUCCESS! Data is safely stored inside your Neon Cloud Database.")

if __name__ == "__main__":
    print("🏃 Running main ingestion pipeline...")
    sample_text = "NVIDIA's data center revenue hit a record $26.3 billion this quarter, driven by massive demand for Hopper architecture AI chips."
    upload_to_neon("NVDA", "Q3_Report.txt", sample_text)