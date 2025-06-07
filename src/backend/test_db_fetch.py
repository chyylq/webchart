"""
Test script for fetch_module_data_from_db in db.py
Run with: python -m asyncio src/backend/test_db_fetch.py
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))
from dotenv import load_dotenv
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../../.env'))
from db import fetch_module_data_from_db

async def main():
    import os
    print("DB CONNECTION PARAMETERS:")
    print("PG_USER:", os.getenv("PG_USER"))
    print("PG_DATABASE:", os.getenv("PG_DATABASE"))
    print("PG_HOST:", os.getenv("PG_HOST"))
    print("PG_PORT:", os.getenv("PG_PORT"))
    # Do not print password for security
    module_name = "option_delta_iv_d2e_current"
    params = {"ticker": "AAPL"}  # <-- Replace with a valid ticker in your DB
    df = await fetch_module_data_from_db(module_name, **params)
    print(df)

if __name__ == "__main__":
    asyncio.run(main())
