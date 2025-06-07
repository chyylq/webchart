"""
oi_chart.py
Module for stock oi data manipulation.

Exposes a standard `process` function for use by the backend dispatcher.
"""
import pandas as pd

def process(df: pd.DataFrame, frequency: str, instrument: str, **kwargs) -> dict:
    """
    Processes the instrument data by adding moving averages and any other user-defined features.

    Called from: src/backend/main.py (dynamic module loader).

    Args:
        df (pd.DataFrame): Raw instrument data (must include a 'close' column).
        frequency (str): 'daily' or 'hourly'.
        instrument (str): Instrument name.
        **kwargs: Additional parameters if needed.

    Returns:
        dict: {
            'data': processed DataFrame as records (list of dicts),
            'plot_columns': list of columns to plot (e.g., ['close', 'ma20', 'ma60', 'ma120'])
        }
    """
    df = df.copy()    
    plot_columns = ['open_interest']
    return {
        'data': df.to_dict(orient='records'),
        'plot_columns': plot_columns
    }

# Optional: human-readable name for frontend display
MODULE_NAME = "OI"
