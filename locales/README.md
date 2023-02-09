# Translation Script - translate.js

This script translate.js translates JSON data in the "./locales/en/translation.json" file to specified languages.

```javascript
node ./locales/translate.js


## Prerequisites
- Azure Translator Text API Key with the environment variable name `AZURE_TRANSLATOR_API_KEY`
- The target language in the `languages` array
- The "./locales/en/translation.json" file with the original text in English
- The target language files in the format of "./locales/{languageCode}/translation.json"

## How it works
- The script loads the English file and target language files
- The script iterates through the English data and translate each string that doesn't exist in the target language file
- The script saves the translated data to the target language file

## Required Libraries
- `dotenv` for loading environment variables
- `fs` for reading and writing files
- `axios` for making API calls