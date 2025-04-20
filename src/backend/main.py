"""
FastAPI backend for financial instrument data API (POC).
Serves instrument list and instrument data from CSV files in ../data/.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import pandas as pd
import os

app = FastAPI()

# Allow CORS for frontend dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = os.path.join(os.path.dirname(__file__), '../../data')

FREQUENCY_DIRS = {
    'daily': 'futures-active_adjusted_1day',
    'hourly': 'futures-active_adjusted_1hour',
}

DEFAULT_COLS = ['date', 'open', 'high', 'low', 'close', 'volume', 'open_interest']

@app.get("/instruments")
def list_instruments():
    """List available instruments and frequencies."""
    result = {}
    for freq, subdir in FREQUENCY_DIRS.items():
        freq_dir = os.path.join(DATA_DIR, subdir)
        if os.path.exists(freq_dir):
            files = [f[:-4] if f.endswith('.csv') else f[:-4] if f.endswith('.txt') else f for f in os.listdir(freq_dir) if f.endswith('.csv') or f.endswith('.txt')]
            result[freq] = files
        else:
            result[freq] = []
    return result

from .data_manipulation import process_instrument_data

@app.get("/data/{frequency}/{instrument}")
def get_instrument_data(frequency: str, instrument: str, start: str = None, end: str = None):
    """Return processed instrument data and plot columns as JSON, with optional date filtering. Frequency is 'daily' or 'hourly'."""
    if frequency not in FREQUENCY_DIRS:
        raise HTTPException(status_code=400, detail="Invalid frequency")
    freq_dir = os.path.join(DATA_DIR, FREQUENCY_DIRS[frequency])
    # Try .csv first, then .txt
    file_path = os.path.join(freq_dir, f"{instrument}.csv")
    if not os.path.exists(file_path):
        file_path = os.path.join(freq_dir, f"{instrument}.txt")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Instrument not found")
    # Read CSV with no header and assign default columns
    df = pd.read_csv(file_path, header=None, names=DEFAULT_COLS)
    # Optionally filter by date
    if start or end:
        df['date'] = pd.to_datetime(df['date'])
        if start:
            df = df[df['date'] >= pd.to_datetime(start)]
        if end:
            df = df[df['date'] <= pd.to_datetime(end)]
    # Process data using the data manipulation module
    result = process_instrument_data(df, frequency, instrument)
    return result

