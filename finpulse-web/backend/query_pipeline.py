import os
import psycopg
from google import genai
from google.genai import types  # Imported to match vector query sizes
from dotenv import load_dotenv

load_dotenv()

db_url = os.getenv("DATABASE_URL")
gemini_key = os.getenv("GEMINI_API_KEY")

def ask_finpulse(user_query):
    client = genai.Client(api_key=gemini_key)

    # 1. Convert the user's question into a matching 1536-dimensional vector
    res = client.models.embed_content(
        model="gemini-embedding-001",
        contents=user_query,
        config=types.EmbedContentConfig(output_dimensionality=1536)
    )
    query_vector = res.embeddings[0].values

    # 2. Search Neon Cloud using Cosine Similarity matching across 1536 variables
    context_chunks = []
    with psycopg.connect(db_url) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT content_chunk 
                FROM financial_knowledge_base 
                ORDER BY embedding <=> %s::vector 
                LIMIT 1;
                """,
                (query_vector,)
            )
            results = cur.fetchall()
            context_chunks = [row[0] for row in results]

    context = "\n".join(context_chunks) if context_chunks else "No relevant context found."

    # 3. Pass the structural database facts to Gemini to generate the UI statement
    ai_response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=f"You are FinPulse AI, a precise financial assistant. Answer the user's question accurately using ONLY this background context facts:\n{context}\n\nQuestion: {user_query}"
    )
    
    return ai_response.text

if __name__ == "__main__":
    prompt = "How much did NVIDIA make in their data center business?"
    print(f"User Question: {prompt}\n")
    
    answer = ask_finpulse(prompt)
    print(f"FinPulse AI Response:\n{answer}")