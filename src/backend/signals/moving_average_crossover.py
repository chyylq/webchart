"""
moving_average_crossover.py
Signal script for detecting moving average crossovers (e.g., MA20/MA60).

Usage: Import and call detect_ma_crossover(df, short_col, long_col)
"""
import pandas as pd
import numpy as np
from typing import List, Dict

def get_signal_info():
    """Return metadata for this signal script for frontend dynamic discovery."""
    return {
        "value": "moving_average_crossover",
        "label": "Moving Average Crossover",
        "params": [
            {"key": "short_period", "label": "Short Period", "type": "number", "default": 20},
            {"key": "long_period", "label": "Long Period", "type": "number", "default": 60},
        ]
    }

def process(df: pd.DataFrame, frequency: str, instrument: str, short_period: int = 20, long_period: int = 60, **kwargs) -> pd.DataFrame:
    short_period = int(short_period)
    long_period = int(long_period)
    if short_period < 1 or long_period < 1:
        raise ValueError("short_period and long_period must be >= 1")
    """
    Process function for moving average crossover signal.

    Args:
        df (pd.DataFrame): Input instrument data (must include 'date' and 'close').
        frequency (str): Data frequency ('daily', 'hourly', etc.).
        instrument (str): Instrument name.
        short_period (int): Window for short MA (default 20).
        long_period (int): Window for long MA (default 60).
        **kwargs: Additional parameters.

    Returns:
        pd.DataFrame: DataFrame with at least 'date' and 'signal' columns.
    """
    df = df.copy()
    df['ma_short'] = df['close'].rolling(window=short_period).mean()
    df['ma_long'] = df['close'].rolling(window=long_period).mean()
    df['signal'] = 0
    df.loc[(df['ma_short'] > df['ma_long']) & (df['ma_short'].shift(1) <= df['ma_long'].shift(1)), 'signal'] = 1
    df.loc[(df['ma_short'] < df['ma_long']) & (df['ma_short'].shift(1) >= df['ma_long'].shift(1)), 'signal'] = -1

    out = df[['date', 'signal']].copy()
    out = out.replace([np.inf, -np.inf], 0)
    return out

