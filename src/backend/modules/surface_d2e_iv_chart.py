"""
surface_d2e_iv_chart.py
Module for plotting implied volatility (IV) surface as a heatmap (d2e vs. strike/date).

Exposes a standard `process` function for use by the backend dispatcher.
"""
import pandas as pd
try:
    from ..db import fetch_module_data_from_db
    from ..db_metadata import get_key_to_label
except ImportError:
    from db import fetch_module_data_from_db
    from db_metadata import get_key_to_label

def process(df: pd.DataFrame, frequency: str, instrument: str, **kwargs) -> dict:
    """
    Processes the instrument data to produce an IV surface heatmap (d2e vs. strike/date).
    If the data is already pivoted (DB fetch), directly extract z, x, y.
    Otherwise, pivot the data from long format.
    Returns:
        dict: {
            'data': z-matrix (2D list),
            'x': list of x-axis labels (dates),
            'y': list of y-axis labels (d2e),
            'plot_columns': ['iv_surface'],
            'chart_types': {'iv_surface': 'heatmap'},
            'heatmap_meta': { 'zlabel': 'IV', 'xlabel': 'Date', 'ylabel': 'D2E' }
        }
    """
    # If already pivoted (DB fetch): columns are dates, index is d2e, values are IV
    if 'iv' not in df.columns and 'date' not in df.columns and 'd2e' not in df.columns:
        # Assume already pivoted: first column is 'ticker' (optional), second is 'd2e', rest are x (dates/strikes)
        cols = list(df.columns)
        cols_to_exclude = set(['ticker', 'd2e'])
        x = [c for c in cols if c not in cols_to_exclude]
        y = df['d2e'] if 'd2e' in df else df.index
        # If 'ticker' column exists, drop it
        df_no_ticker = df.drop(columns=[c for c in df.columns if c == 'ticker'], errors='ignore')
        # Exclude 'd2e' column from z-matrix, use as y-axis
        z = df_no_ticker[x].values.tolist() if 'd2e' in df_no_ticker else df_no_ticker.values.tolist()
        y = df_no_ticker['d2e'].tolist() if 'd2e' in df_no_ticker else list(df_no_ticker.index)
    else:
        # Not pivoted, pivot as before
        if not set(['date', 'd2e', 'iv']).issubset(df.columns):
            raise ValueError("DataFrame must contain 'date', 'd2e', 'iv' columns.")
        heatmap = df.pivot(index='d2e', columns='date', values='iv').sort_index(axis=0).sort_index(axis=1)
        z = heatmap.values.tolist()
        x = list(heatmap.columns)
        y = list(heatmap.index)
    # Map x keys to labels for frontend display
    key_to_label = get_key_to_label("option_delta_iv_d2e_current")
    x_labels = [key_to_label.get(xi, xi) for xi in x]
    return {
        'data': z,
        'x': x_labels,
        'y': y,
        'plot_columns': ['iv_surface'],
        'chart_types': {'iv_surface': 'heatmap'},
        'heatmap_meta': {
            'zlabel': 'IV',
            'xlabel': 'Delta',
            'ylabel': 'D2E'
        }
    }

MODULE_NAME = "IV Surface (D2E Heatmap)"

async def process_from_db(frequency: str, instrument: str, **kwargs) -> dict:
    """
    Fetches data from the database for this module and processes it into a heatmap dict.
    Args:
        frequency (str): Frequency string (e.g., 'daily')
        instrument (str): Instrument code
        kwargs: Additional parameters (e.g., start, end)
    Returns:
        dict: Same output as process()
    """
    df = await fetch_module_data_from_db("option_delta_iv_d2e_current", frequency=frequency, instrument=instrument, **kwargs)
    return process(df, frequency, instrument, **kwargs)
