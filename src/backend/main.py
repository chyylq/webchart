"""
FastAPI backend for financial instrument data API (POC).
Serves instrument list and instrument data from CSV files in ../data/.
"""
from fastapi import FastAPI, HTTPException, Request
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
def list_local_instruments():
    """List available instruments and frequencies from local directory. Each entry is a dict with 'instrument' and 'filename'."""
    result = {}
    for freq, subdir in FREQUENCY_DIRS.items():
        freq_dir = os.path.join(DATA_DIR, subdir)
        instrument_list = []
        if os.path.exists(freq_dir):
            for f in os.listdir(freq_dir):
                if f.endswith('.csv') or f.endswith('.txt'):
                    filename = f[:-4]
                    instrument = filename.split('_')[0]
                    instrument_list.append({
                        'instrument': instrument,
                        'filename': filename
                    })
        result[freq] = instrument_list
    return result

import importlib
import pkgutil
import pathlib
from src.backend.signals import list_available_signals

MODULES_DIR = pathlib.Path(__file__).parent / "modules"


def list_available_modules():
    """Dynamically list all available manipulation modules in modules/ directory."""
    modules = []
    for module_info in pkgutil.iter_modules([str(MODULES_DIR)]):
        if module_info.name.startswith("_") or not module_info.name.endswith(""):
            continue
        try:
            mod = importlib.import_module(f"src.backend.modules.{module_info.name}")
            module_name = getattr(mod, "MODULE_NAME", module_info.name)
        except Exception:
            module_name = module_info.name
        modules.append({
            "module": module_info.name,
            "display_name": module_name
        })
    return modules

# --- END MODULE LISTING UTILS ---

@app.get("/signals")
def get_signals():
    """List all available signal scripts and their parameter definitions."""
    return list_available_signals()


@app.get("/modules")
def get_modules():
    """List all available data manipulation modules for the frontend."""
    return list_available_modules()


@app.get("/signal/{signal_name}/{frequency}/{instrument}")
def get_signal(
    signal_name: str,
    frequency: str,
    instrument: str,
    request: Request,
    start: str = None,
    end: str = None,
):
    """
    Returns signal events for a given instrument and signal script as JSON.
    Supports date filtering and signal-specific kwargs.
    """
    if frequency not in FREQUENCY_DIRS:
        raise HTTPException(status_code=400, detail="Invalid frequency")
    freq_dir = os.path.join(DATA_DIR, FREQUENCY_DIRS[frequency])
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
    # Dynamically import and use the selected signal script
    try:
        signal_mod = importlib.import_module(f"src.backend.signals.{signal_name}")
    except ModuleNotFoundError:
        raise HTTPException(status_code=400, detail=f"Signal '{signal_name}' not found.")
    if not hasattr(signal_mod, "process"):
        raise HTTPException(status_code=500, detail=f"Signal '{signal_name}' does not have a 'process' function.")
    query_params = request.query_params
    signal_kwargs = {k: v for k, v in query_params.items() if k not in ['start', 'end']}
    signal_df = signal_mod.process(df, frequency, instrument, **signal_kwargs)
    return signal_df.to_dict(orient="records")


from fastapi import Query

@app.get("/data/{frequency}/{instrument}")
async def get_instrument_data(
    frequency: str,
    instrument: str,
    start: str = None,
    end: str = None,
    module: str = "stock_chart",
    source: str = Query("local", description="Data source: 'local' for files, 'remote' for database")
):
    """
    Return processed instrument data and plot columns as JSON, with optional date filtering and module selection.
    Frequency is 'daily' or 'hourly'.
    The 'module' query parameter selects the data manipulation module to use.
    The 'instrument' parameter is the instrument code (not filename).
    The 'source' parameter determines if data is fetched from local files or remote database.
    """
    if frequency not in FREQUENCY_DIRS:
        raise HTTPException(status_code=400, detail="Invalid frequency")

    if source == "remote":
        try:
            module_mod = importlib.import_module(f"src.backend.modules.{module}")
        except ModuleNotFoundError:
            raise HTTPException(status_code=400, detail=f"Module '{module}' not found.")
        if not hasattr(module_mod, "process_from_db"):
            raise HTTPException(status_code=500, detail=f"Module '{module}' does not have a 'process_from_db' function.")
        # Call the async process_from_db function with all relevant parameters
        result = await module_mod.process_from_db(frequency=frequency, instrument=instrument, start=start, end=end)
        return result

    # --- LOCAL FILE LOGIC ---
    freq_dir = os.path.join(DATA_DIR, FREQUENCY_DIRS[frequency])
    # Try to resolve instrument as filename first
    file_path = os.path.join(freq_dir, f"{instrument}.csv")
    if not os.path.exists(file_path):
        file_path = os.path.join(freq_dir, f"{instrument}.txt")
    # If not found, try to resolve as instrument code
    if not os.path.exists(file_path):
        matched_file = None
        for f in os.listdir(freq_dir):
            if (f.endswith('.csv') or f.endswith('.txt')) and f.startswith(f"{instrument}_"):
                matched_file = f
                break
        if matched_file:
            file_path = os.path.join(freq_dir, matched_file)
        else:
            raise HTTPException(status_code=404, detail="Instrument not found in local files.")

    # Read CSV with no header and assign default columns
    df = pd.read_csv(file_path, header=None, names=DEFAULT_COLS)
    # Optionally filter by date
    if start or end:
        df['date'] = pd.to_datetime(df['date'])
        if start:
            df = df[df['date'] >= pd.to_datetime(start)]
        if end:
            df = df[df['date'] <= pd.to_datetime(end)]
    # Dynamically import and use the selected module
    try:
        module_mod = importlib.import_module(f"src.backend.modules.{module}")
    except ModuleNotFoundError:
        raise HTTPException(status_code=400, detail=f"Module '{module}' not found.")
    if not hasattr(module_mod, "process"):
        raise HTTPException(status_code=500, detail=f"Module '{module}' does not have a 'process' function.")
    result = module_mod.process(df, frequency, instrument)
    return result
