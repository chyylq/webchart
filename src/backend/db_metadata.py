"""
DB_METADATA: Maps frontend module names to database function names and column metadata.
Each entry contains:
- function: database-side function to call
- columns: ordered list of dicts with keys:
    - db: column name in DB result
    - key: logical key to use in API (frontend)
    - label: human-readable label for frontend (optional)
"""

def get_key_to_label(module_name):
    """
    Returns a dict mapping logical key to label for the given module, falling back to key if label is missing.
    """
    columns_meta = DB_METADATA[module_name]["columns"]
    return {col["key"]: col.get("label", col["key"]) for col in columns_meta}

DB_METADATA = {
    "option_delta_iv_d2e_current": {
        "schema": "spiderrock_data",
        "function": "get_option_delta_iv_d2e_current_by_ticker",
        "params": [
            {"name": "ticker", "type": "str", "required": True}
        ],
        "columns": [
            # Example: fill in actual columns below
            {"db": "r_ticker", "key": "ticker", "label": "ticker"},
            {"db": "r_d2e_key", "key": "d2e", "label": "d2e"},
            {"db": "r_iv_delta_95", "key": "iv_delta_95", "label": "95"},
            {"db": "r_iv_delta_90", "key": "iv_delta_90", "label": "90"},
            {"db": "r_iv_delta_85", "key": "iv_delta_85", "label": "85"},
            {"db": "r_iv_delta_80", "key": "iv_delta_80", "label": "80"},
            {"db": "r_iv_delta_75", "key": "iv_delta_75", "label": "75"},
            {"db": "r_iv_delta_70", "key": "iv_delta_70", "label": "70"},
            {"db": "r_iv_delta_65", "key": "iv_delta_65", "label": "65"},
            {"db": "r_iv_delta_60", "key": "iv_delta_60", "label": "60"},
            {"db": "r_iv_delta_55", "key": "iv_delta_55", "label": "55"},
            {"db": "r_iv_delta_50", "key": "iv_delta_50", "label": "50"},
            {"db": "r_iv_delta_45", "key": "iv_delta_45", "label": "45"},
            {"db": "r_iv_delta_40", "key": "iv_delta_40", "label": "40"},
            {"db": "r_iv_delta_35", "key": "iv_delta_35", "label": "35"},
            {"db": "r_iv_delta_30", "key": "iv_delta_30", "label": "30"},
            {"db": "r_iv_delta_25", "key": "iv_delta_25", "label": "25"},
            {"db": "r_iv_delta_20", "key": "iv_delta_20", "label": "20"},
            {"db": "r_iv_delta_15", "key": "iv_delta_15", "label": "15"},
            {"db": "r_iv_delta_10", "key": "iv_delta_10", "label": "10"},
            {"db": "r_iv_delta_5", "key": "iv_delta_5", "label": "5"}
        ]
    },
    "option_delta_iv_current": {
        "schema": "spiderrock_data",
        "function": "get_option_delta_iv_current_by_ticker",
        "params": [
            {"name": "ticker", "type": "str", "required": True}
        ],
        "columns": [
            # ... fill in columns for this function
            {"db": "r_ticker", "key": "ticker", "label": "ticker"},
            {"db": "r_expiration_date", "key": "exp", "label": "exp"},
            {"db": "r_iv_bid_delta_95", "key": "ivb_delta_95", "label": "95"},
            {"db": "r_iv_bid_delta_90", "key": "ivb_delta_90", "label": "90"},
            {"db": "r_iv_bid_delta_85", "key": "ivb_delta_85", "label": "85"},
            {"db": "r_iv_bid_delta_80", "key": "ivb_delta_80", "label": "80"},
            {"db": "r_iv_bid_delta_75", "key": "ivb_delta_75", "label": "75"},
            {"db": "r_iv_bid_delta_70", "key": "ivb_delta_70", "label": "70"},
            {"db": "r_iv_bid_delta_65", "key": "ivb_delta_65", "label": "65"},
            {"db": "r_iv_bid_delta_60", "key": "ivb_delta_60", "label": "60"},
            {"db": "r_iv_bid_delta_55", "key": "ivb_delta_55", "label": "55"},
            {"db": "r_iv_bid_delta_50", "key": "ivb_delta_50", "label": "50"},
            {"db": "r_iv_bid_delta_45", "key": "ivb_delta_45", "label": "45"},
            {"db": "r_iv_bid_delta_40", "key": "ivb_delta_40", "label": "40"},
            {"db": "r_iv_bid_delta_35", "key": "ivb_delta_35", "label": "35"},
            {"db": "r_iv_bid_delta_30", "key": "ivb_delta_30", "label": "30"},
            {"db": "r_iv_bid_delta_25", "key": "ivb_delta_25", "label": "25"},
            {"db": "r_iv_bid_delta_20", "key": "ivb_delta_20", "label": "20"},
            {"db": "r_iv_bid_delta_15", "key": "ivb_delta_15", "label": "15"},
            {"db": "r_iv_bid_delta_10", "key": "ivb_delta_10", "label": "10"},
            {"db": "r_iv_bid_delta_5", "key": "ivb_delta_5", "label": "5"},
            {"db": "r_iv_ask_delta_95", "key": "iva_delta_95", "label": "95"},
            {"db": "r_iv_ask_delta_90", "key": "iva_delta_90", "label": "90"},
            {"db": "r_iv_ask_delta_85", "key": "iva_delta_85", "label": "85"},
            {"db": "r_iv_ask_delta_80", "key": "iva_delta_80", "label": "80"},
            {"db": "r_iv_ask_delta_75", "key": "iva_delta_75", "label": "75"},
            {"db": "r_iv_ask_delta_70", "key": "iva_delta_70", "label": "70"},
            {"db": "r_iv_ask_delta_65", "key": "iva_delta_65", "label": "65"},
            {"db": "r_iv_ask_delta_60", "key": "iva_delta_60", "label": "60"},
            {"db": "r_iv_ask_delta_55", "key": "iva_delta_55", "label": "55"},
            {"db": "r_iv_ask_delta_50", "key": "iva_delta_50", "label": "50"},
            {"db": "r_iv_ask_delta_45", "key": "iva_delta_45", "label": "45"},
            {"db": "r_iv_ask_delta_40", "key": "iva_delta_40", "label": "40"},
            {"db": "r_iv_ask_delta_35", "key": "iva_delta_35", "label": "35"},
            {"db": "r_iv_ask_delta_30", "key": "iva_delta_30", "label": "30"},
            {"db": "r_iv_ask_delta_25", "key": "iva_delta_25", "label": "25"},
            {"db": "r_iv_ask_delta_20", "key": "iva_delta_20", "label": "20"},
            {"db": "r_iv_ask_delta_15", "key": "iva_delta_15", "label": "15"},
            {"db": "r_iv_ask_delta_10", "key": "iva_delta_10", "label": "10"},
            {"db": "r_iv_ask_delta_5", "key": "iva_delta_5", "label": "5"}
        ]
    },
    "option_delta_iv_d2e_skew_current": {
        "schema": "spiderrock_data",
        "function": "get_option_delta_iv_d2e_skew_current_by_ticker",
        "params": [
            {"name": "ticker", "type": "str", "required": True}
        ],
        "columns": [
            # ... fill in columns for this function
            {"db": "r_ticker", "key": "ticker", "label": "ticker"},
            {"db": "r_d2e_key", "key": "d2e", "label": "d2e"},
            {"db": "r_skew_iv_delta_95", "key": "skew_delta_95", "label": "95"},
            {"db": "r_skew_iv_delta_90", "key": "skew_delta_90", "label": "90"},
            {"db": "r_skew_iv_delta_85", "key": "skew_delta_85", "label": "85"},
            {"db": "r_skew_iv_delta_80", "key": "skew_delta_80", "label": "80"},
            {"db": "r_skew_iv_delta_75", "key": "skew_delta_75", "label": "75"},
            {"db": "r_skew_iv_delta_70", "key": "skew_delta_70", "label": "70"},
            {"db": "r_skew_iv_delta_65", "key": "skew_delta_65", "label": "65"},
            {"db": "r_skew_iv_delta_60", "key": "skew_delta_60", "label": "60"},
            {"db": "r_skew_iv_delta_55", "key": "skew_delta_55", "label": "55"},
            {"db": "r_skew_iv_delta_50", "key": "skew_delta_50", "label": "50"},
            {"db": "r_skew_iv_delta_45", "key": "skew_delta_45", "label": "45"},
            {"db": "r_skew_iv_delta_40", "key": "skew_delta_40", "label": "40"},
            {"db": "r_skew_iv_delta_35", "key": "skew_delta_35", "label": "35"},
            {"db": "r_skew_iv_delta_30", "key": "skew_delta_30", "label": "30"},
            {"db": "r_skew_iv_delta_25", "key": "skew_delta_25", "label": "25"},
            {"db": "r_skew_iv_delta_20", "key": "skew_delta_20", "label": "20"},
            {"db": "r_skew_iv_delta_15", "key": "skew_delta_15", "label": "15"},
            {"db": "r_skew_iv_delta_10", "key": "skew_delta_10", "label": "10"},
            {"db": "r_skew_iv_delta_5", "key": "skew_delta_5", "label": "5"}
        ]
    },
    "option_delta_iv_skew_current": {
        "schema": "spiderrock_data",
        "function": "get_option_delta_iv_skew_current_by_ticker",
        "params": [
            {"name": "ticker", "type": "str", "required": True}
        ],
        "columns": [
            # ... fill in columns for this function
            {"db": "r_ticker", "key": "ticker", "label": "ticker"},
            {"db": "r_expiration_date", "key": "exp", "label": "exp"},
            {"db": "r_skew_iv_delta_95", "key": "skew_delta_95", "label": "95"},
            {"db": "r_skew_iv_delta_90", "key": "skew_delta_90", "label": "90"},
            {"db": "r_skew_iv_delta_85", "key": "skew_delta_85", "label": "85"},
            {"db": "r_skew_iv_delta_80", "key": "skew_delta_80", "label": "80"},
            {"db": "r_skew_iv_delta_75", "key": "skew_delta_75", "label": "75"},
            {"db": "r_skew_iv_delta_70", "key": "skew_delta_70", "label": "70"},
            {"db": "r_skew_iv_delta_65", "key": "skew_delta_65", "label": "65"},
            {"db": "r_skew_iv_delta_60", "key": "skew_delta_60", "label": "60"},
            {"db": "r_skew_iv_delta_55", "key": "skew_delta_55", "label": "55"},
            {"db": "r_skew_iv_delta_50", "key": "skew_delta_50", "label": "50"},
            {"db": "r_skew_iv_delta_45", "key": "skew_delta_45", "label": "45"},
            {"db": "r_skew_iv_delta_40", "key": "skew_delta_40", "label": "40"},
            {"db": "r_skew_iv_delta_35", "key": "skew_delta_35", "label": "35"},
            {"db": "r_skew_iv_delta_30", "key": "skew_delta_30", "label": "30"},
            {"db": "r_skew_iv_delta_25", "key": "skew_delta_25", "label": "25"},
            {"db": "r_skew_iv_delta_20", "key": "skew_delta_20", "label": "20"},
            {"db": "r_skew_iv_delta_15", "key": "skew_delta_15", "label": "15"},
            {"db": "r_skew_iv_delta_10", "key": "skew_delta_10", "label": "10"},
            {"db": "r_skew_iv_delta_5", "key": "skew_delta_5", "label": "5"}
        ]
    },
}
