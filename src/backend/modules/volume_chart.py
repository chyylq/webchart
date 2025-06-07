"""
volume_chart.py
Module for stock volume data manipulation.

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
            'plot_columns': list of columns to plot (e.g., ['volume'])
            'chart_types': dict mapping each plot_column to a chart type (e.g., {'volume': 'bar'})
        }
    """
    df = df.copy()    
    plot_columns = ['volume']
    return {
        'data': df.to_dict(orient='records'),
        'plot_columns': plot_columns,
        'chart_types': {
            'volume': 'bar'
        }
    }

# Optional: human-readable name for frontend display
MODULE_NAME = "Volume"
