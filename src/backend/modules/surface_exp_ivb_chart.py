"""
surface_exp_ivb_chart.py
Module for plotting implied volatility (IV Bid) surface as a heatmap (expiration vs. delta).
"""
import pandas as pd
try:
    from ..db import fetch_module_data_from_db
    from ..db_metadata import get_key_to_label, DB_METADATA
except ImportError:
    from db import fetch_module_data_from_db
    from db_metadata import get_key_to_label, DB_METADATA

def process(df: pd.DataFrame, frequency: str, ticker: str, **kwargs) -> dict:
    """
    Processes the ticker data to produce an IV Bid surface heatmap (expiration vs. delta).
    Only includes ivb (bid) delta columns on the x-axis.
    """
    meta = DB_METADATA["option_delta_iv_current"]
    # Only use ivb columns for x-axis
    x = [col['key'] for col in meta['columns'] if col['key'].startswith('ivb_delta_')]
    df_no_ticker = df.drop(columns=[c for c in df.columns if c == 'ticker'], errors='ignore')
    z = df_no_ticker[x].values.tolist() if 'exp' in df_no_ticker else df_no_ticker.values.tolist()
    y = df_no_ticker['exp'].tolist() if 'exp' in df_no_ticker else list(df_no_ticker.index)
    if y and len(y) > 1 and y[0] > y[-1]:
        y = y[::-1]
        z = z[::-1]
    y_labels = [str(v) for v in y]
    key_to_label = get_key_to_label("option_delta_iv_current")
    x_labels = [key_to_label.get(xi, xi) for xi in x]
    def safe_matrix(z):
        import numpy as np
        return [
            [None if (isinstance(v, float) and (np.isnan(v) or np.isinf(v))) else v for v in row]
            for row in z
        ]
    def round_matrix(z):
        return [
            [round(v, 1) if isinstance(v, (float, int)) and v is not None else v for v in row]
            for row in z
        ]
    print("[DEBUG][IVB] x_labels:", x_labels)
    print("[DEBUG][IVB] y (exp):", y)
    return {
        'data_type': 'matrix',
        'data': round_matrix(safe_matrix(z)),
        'x': x_labels,
        'y': y,
        'y_labels': y_labels,
        'plot_columns': ['iv_surface_ivb'],
        'chart_type': 'heatmap',
        'heatmap_meta': {
            'zlabel': 'IV Bid',
            'xlabel': 'Delta',
            'ylabel': 'Expiration'
        }
    }

MODULE_NAME = "IV Surface (Expiration IV Bid Heatmap)"
DEFAULT_SOURCE = 'remote'

async def process_from_db(frequency: str, ticker: str, **kwargs) -> dict:
    """
    Fetches data from the database for this module and processes it into a heatmap dict.
    Args:
        frequency (str): Frequency string (e.g., 'daily')
        ticker (str): Ticker code
    Returns:
        dict: Output of process()
    """
    df = await fetch_module_data_from_db("option_delta_iv_current", ticker=ticker, frequency=frequency, **kwargs)
    return process(df, frequency, ticker, **kwargs)
