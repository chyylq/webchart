"""
Database utility for PostgreSQL async access using asyncpg.
Loads credentials from environment variables for security.
"""
import asyncpg
import os
from dotenv import load_dotenv
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))
import pandas as pd
try:
    from .db_metadata import DB_METADATA
except ImportError:
    from db_metadata import DB_METADATA

_DB_POOL = None

async def get_db_pool():
    global _DB_POOL
    if _DB_POOL is None:
        _DB_POOL = await asyncpg.create_pool(
            user=os.getenv("PG_USER"),
            password=os.getenv("PG_PASSWORD"),
            database=os.getenv("PG_DATABASE"),
            host=os.getenv("PG_HOST"),
            port=int(os.getenv("PG_PORT", 5432)),
            min_size=1,
            max_size=5
        )
    return _DB_POOL

async def fetch_module_data_from_db(module_name, **kwargs):
    """
    Generic DB fetcher based on db_metadata.py. Looks up the function, params, and columns for the module.
    Dynamically builds the SQL call and formats the result as a DataFrame with logical keys.
    Args:
        module_name (str): The frontend/backend module name (key in DB_METADATA)
        kwargs: All possible input parameters (will be filtered by param metadata)
    Returns:
        pd.DataFrame: DataFrame with columns renamed to logical keys.
    """
    meta = DB_METADATA[module_name]
    db_function = meta['function']
    schema = meta.get('schema')
    param_meta = meta.get('params', [])
    columns_meta = meta['columns']
    # Build argument list in order
    arg_names = [p['name'] for p in param_meta]
    args = [kwargs.get(name) for name in arg_names]
    print("[DEBUG] Arg names:", arg_names)
    print("[DEBUG] Args:", args)
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        if schema:
            sql = f"SELECT * FROM {schema}.{db_function}({', '.join(f'${i+1}' for i in range(len(args)))})"
        else:
            sql = f"SELECT * FROM {db_function}({', '.join(f'${i+1}' for i in range(len(args)))})"
        print("[DEBUG] SQL:", sql)
        print("[DEBUG] Args:", args)
        rows = await conn.fetch(sql, *args)
        print(f"[DEBUG] DB fetch returned {len(rows)} rows.")
        if rows:
            print(f"[DEBUG] First row: {dict(rows[0])}")
        else:
            print("[DEBUG] No rows returned from DB.")
        df = pd.DataFrame([dict(row) for row in rows])
        # Rename columns to logical keys for downstream processing
        rename_map = {col['db']: col['key'] for col in columns_meta}
        df = df.rename(columns=rename_map)
        if not df.empty:
            print("[DEBUG] DataFrame first row after rename:", df.head(1))
        else:
            print("[DEBUG] DataFrame is empty after rename.")
        return df
