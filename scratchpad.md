# Lessons

- For website image paths, always use the correct relative path (e.g., 'images/filename.png') and ensure the images directory exists
- For search results, ensure proper handling of different character encodings (UTF-8) for international queries
- Add debug information to stderr while keeping the main output clean in stdout for better pipeline integration
- When using seaborn styles in matplotlib, use 'seaborn-v0_8' instead of 'seaborn' as the style name due to recent seaborn version changes
- When using Jest, a test suite can fail even if all individual tests pass, typically due to issues in suite-level setup code or lifecycle hooks
- Python virtual environment is named 'py310' not 'py3' - corrected previous mistake
- CSV column names are case-sensitive, always check the actual column names in the data file
- When saving files, sanitize filenames by removing special characters that might be invalid in file systems
- When accessing pandas Series with integer index, use .iloc[] to avoid deprecation warning
- For datetime parsing with mixed timezones, use .apply(lambda x: x.replace(tzinfo=None)) instead of dt.tz_localize(None)
- Remember to use relative paths in the code
- Include debugging info in program output