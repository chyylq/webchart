"""
surface_d2e_iv_chart.py
Module for plotting implied volatility (IV) surface as a heatmap (d2e vs. strike/date).

Exposes a standard `process` function for use by the backend dispatcher.
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
    Processes the ticker data to produce an IV surface heatmap (d2e vs. strike/date).
    If the data is already pivoted (DB fetch), directly extract z, x, y.
    Otherwise, pivot the data from long format.
    Returns:
        dict: {
            'data': z-matrix (2D list),
            'x': list of x-axis labels (delta),
            'y': list of y-axis labels (d2e),
            'plot_columns': ['iv_surface'],
            'chart_type': 'heatmap',
            'heatmap_meta': { 'zlabel': 'IV', 'xlabel': 'Delta', 'ylabel': 'D2E' }
        }
    """
    # Assume data is always pivoted: columns are deltas, index is d2e, values are IV
    meta = DB_METADATA["option_delta_iv_d2e_current"]
    x = [col['key'] for col in meta['columns'] if col['key'] not in ('ticker', 'd2e')]
    # If 'ticker' column exists, drop it
    df_no_ticker = df.drop(columns=[c for c in df.columns if c == 'ticker'], errors='ignore')
    # Exclude 'd2e' column from z-matrix, use as y-axis
    z = df_no_ticker[x].values.tolist() if 'd2e' in df_no_ticker else df_no_ticker.values.tolist()
    y = df_no_ticker['d2e'].tolist() if 'd2e' in df_no_ticker else list(df_no_ticker.index)
    # Flip y, y_labels, and z so smallest d2e is first (top)
    if y and len(y) > 1 and y[0] < y[-1]:
        # Already descending, so reverse to ascending
        y = y[::-1]
        z = z[::-1]
    # Map y values to display labels, rounded to 1 decimal if float
    y_labels = [str(round(v, 1)) if isinstance(v, float) else str(v) for v in y]
    # Map x keys to labels for frontend display
    key_to_label = get_key_to_label("option_delta_iv_d2e_current")
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

    print("[DEBUG] x_labels:", x_labels)
    print("[DEBUG] y:", y)

    return {
        'data_type': 'matrix',
        'data': round_matrix(safe_matrix(z)),
        'x': x_labels,
        'y': y,
        'y_labels': y_labels,
        'plot_columns': ['iv_surface'],
        'chart_type': 'heatmap',
        'heatmap_meta': {
            'zlabel': 'IV',
            'xlabel': 'Delta',
            'ylabel': 'D2E'
        }
    }

MODULE_NAME = "IV Surface (D2E Heatmap)"
DEFAULT_SOURCE = 'remote'

async def process_from_db(frequency: str, ticker: str, **kwargs) -> dict:
    """
    Fetches data from the database for this module and processes it into a heatmap dict.
    Args:
        frequency (str): Frequency string (e.g., 'daily')
        ticker (str): Ticker code
        kwargs: Additional parameters (e.g., start, end)
    Returns:
        dict: Output of process()
    """
    df = await fetch_module_data_from_db("option_delta_iv_d2e_current", ticker=ticker, frequency=frequency, **kwargs)
    return process(df, frequency, ticker, **kwargs)
