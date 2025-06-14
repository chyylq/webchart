"""
Test PostgreSQL connection using asyncpg and environment variables.
Run: python src/backend/test_db_connection.py
"""
import asyncio
import os
from dotenv import load_dotenv
import asyncpg

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

async def test_connection():
    try:
        conn = await asyncpg.connect(
            user=os.getenv("PG_USER"),
            password=os.getenv("PG_PASSWORD"),
            database=os.getenv("PG_DATABASE"),
            host=os.getenv("PG_HOST"),
            port=int(os.getenv("PG_PORT", 5432))
        )
        print("[SUCCESS] Connected to PostgreSQL database.")
        await conn.close()
    except Exception as e:
        print(f"[ERROR] Failed to connect to PostgreSQL: {e}")

if __name__ == "__main__":
    asyncio.run(test_connection())
