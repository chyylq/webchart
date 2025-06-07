# signals/__init__.py
# This package will hold scripts to generate signals or alerts for the financial dashboard.

# Example usage:
# - Each script can define a function that takes instrument data and returns signal events (buy/sell/alert/etc).
# - This __init__.py allows 'signals' to be imported as a Python package.

import pkgutil
import importlib
import pathlib

def list_available_signals():
    """Dynamically list all available signal scripts and their metadata."""
    signals = []
    signals_dir = pathlib.Path(__file__).parent
    for module_info in pkgutil.iter_modules([str(signals_dir)]):
        if module_info.name.startswith("_") or not module_info.name.endswith(""):
            continue
        try:
            mod = importlib.import_module(f"src.backend.signals.{module_info.name}")
            if hasattr(mod, "get_signal_info"):
                signals.append(mod.get_signal_info())
        except Exception as e:
            # Optionally log or print(e)
            continue
    return signals
