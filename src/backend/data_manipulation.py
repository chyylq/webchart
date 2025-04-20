"""
data_manipulation.py
Module for custom data manipulation and feature engineering for instrument time series data.

Functions here take a pandas DataFrame (after loading the instrument data) and return a processed DataFrame.
This is where Python users can add data cleaning, calculations, and feature engineering.
"""
import pandas as pd

def process_instrument_data(df: pd.DataFrame, frequency: str, instrument: str, **kwargs) -> dict:
    """
    Processes the instrument data by adding moving averages and any other user-defined features.

    Called from: src/backend/main.py (in the get_instrument_data FastAPI endpoint).

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
    # Calculate moving averages
    df = df.copy()
    df['ma20'] = df['close'].rolling(window=20, min_periods=1).mean()
    df['ma60'] = df['close'].rolling(window=60, min_periods=1).mean()
    df['ma120'] = df['close'].rolling(window=120, min_periods=1).mean()
    plot_columns = ['close', 'ma20', 'ma60', 'ma120']
    return {
        'data': df.to_dict(orient='records'),
        'plot_columns': plot_columns
    }
