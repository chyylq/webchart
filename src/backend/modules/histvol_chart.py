"""
histvol_chart.py
Module for calculating rolling annualized historical volatility.

Exposes a standard `process` function for use by the backend dispatcher.
"""
import pandas as pd
import numpy as np

def process(df: pd.DataFrame, frequency: str, instrument: str, **kwargs) -> dict:
    """
    Calculates rolling 20, 60, and 250 day annualized historical volatility (close-to-close).

    Called from: src/backend/main.py (dynamic module loader).

    Args:
        df (pd.DataFrame): Raw instrument data (must include a 'close' column).
        frequency (str): 'daily' or 'hourly'.
        instrument (str): Instrument name.
        **kwargs: Additional parameters if needed.

    Returns:
        dict: {
            'data': processed DataFrame as records (list of dicts),
            'plot_columns': list of columns to plot (e.g., ['histvol20', 'histvol60', 'histvol250'])
        }
    """
    df = df.copy()
    # Calculate log returns
    df['log_return'] = np.log(df['close'] / df['close'].shift(1))
    # Annualization factor: sqrt(252) for daily, sqrt(252*24) for hourly (approx)
    if frequency == 'daily':
        ann_factor = np.sqrt(252)
    elif frequency == 'hourly':
        ann_factor = np.sqrt(252*24)
    else:
        ann_factor = 1
    df['histvol20'] = df['log_return'].rolling(window=20, min_periods=1).std() * ann_factor * 100
    df['histvol60'] = df['log_return'].rolling(window=60, min_periods=1).std() * ann_factor * 100
    df['histvol250'] = df['log_return'].rolling(window=250, min_periods=1).std() * ann_factor * 100    

    # Fill all NaN, inf, -inf with 0 for JSON serialization
    df = df.replace([np.inf, -np.inf], np.nan)
    df = df.fillna(0)
    plot_columns = ['histvol20', 'histvol60', 'histvol250']
    return {
        'data': df.to_dict(orient='records'),
        'plot_columns': plot_columns
    }

MODULE_NAME = "Hist Vol"
