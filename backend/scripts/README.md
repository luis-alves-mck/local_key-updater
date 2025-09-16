# Scripts

This directory contains utility scripts for managing the Key Updater application.

## Import Use Cases Script

### Overview
The `importUseCases.ts` script allows you to bulk import use cases into the MongoDB database from a JSON file.

### Usage

1. **Create your JSON file**: Create a file named `use-cases.json` in the `scripts/files/` directory
2. **Run the import**: From the `backend` directory, run:
   ```bash
   npm run set-usecases
   ```

### JSON Format

The JSON file should contain an array of use case objects with the following structure:

```json
[
  {
    "use_case_name": "your-use-case-name",
    "openai_keys": [
      {
        "key_name": "your-key-name",
        "model_name": "gpt-4",
        "key_priority": 1
      }
    ]
  }
]
```

### Fields Description

- **use_case_name** (required): Unique name for the use case
- **openai_keys** (optional): Array of keys associated with this use case
  - **key_name** (required): Name of the API key
  - **model_name** (required): Model name for this key association
  - **key_priority** (required): Priority number (lower = higher priority)

### Example

See `use-cases.example.json` for a complete example with multiple use cases and different configurations.

### Features

- ✅ **Validation**: Checks JSON format and required fields
- ✅ **Duplicate handling**: Skips use cases that already exist
- ✅ **Priority sorting**: Automatically sorts keys by priority
- ✅ **Error reporting**: Detailed error messages and summary
- ✅ **Safe operation**: Only inserts new records, doesn't modify existing ones

### Important Notes

- The script only **inserts** new use cases - it will skip any that already exist
- Use cases are inserted into the **development** environment
- Keys are automatically sorted by priority after import
- The script will validate the JSON format and show helpful error messages

### Troubleshooting

If you encounter issues:

1. **File not found**: Make sure `use-cases.json` exists in `scripts/files/`
2. **Invalid JSON**: Use a JSON validator to check your file format
3. **Database connection**: Ensure your database is running and accessible
4. **Missing fields**: Check that all required fields are present in your JSON