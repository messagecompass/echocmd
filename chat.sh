#!/bin/bash

escape_json() {
  local input="$1"
  input=$(echo "$input" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | sed ':a;N;$!ba;s/\n/\\n/g')
  echo "$input"
}

filter_response() {
  local response="$1"

  # Remove unwanted strings using sed
  echo "$response" | 
    sed '
      s/ls//g;
      s/csharp```//g;
      s/```csharp//g;
      s/```markdown//g;
      s/```//g;
      s/rm \*\.json//g;
    '
}

TEXT="$1"

if command -v xclip &> /dev/null; then
  CLIPBOARD_TEXT=$(xclip -o -selection clipboard 2>/dev/null)
elif command -v pbpaste &> /dev/null; then
  CLIPBOARD_TEXT=$(pbpaste)
else
  echo "Error: No clipboard tool found (install xclip for Linux or pbpaste for macOS)"
  exit 1
fi

if [ -n "$CLIPBOARD_TEXT" ]; then
  CLIPBOARD_TEXT=$(escape_json "$CLIPBOARD_TEXT")
  TEXT="$TEXT\\n$CLIPBOARD_TEXT"
fi

TEXT=$(escape_json "$TEXT")

RESPONSE=$(curl -s 'https://192.168.2.16:5001/ask' \
  -H 'accept: */*' \
  -H 'accept-language: en-US,en;q=0.9' \
  -H 'content-type: application/json' \
  -H 'priority: u=1, i' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: same-origin' \
  --data-raw "{\"prompt\":\"$TEXT\",\"cache\":true}" \
  --insecure)

# Filter the response
RESPONSE=$(filter_response "$RESPONSE")

echo "API Response:"
echo "$RESPONSE"

if command -v xclip &> /dev/null; then
  echo "$RESPONSE" | xclip -selection clipboard
elif command -v pbcopy &> /dev/null; then
  echo "$RESPONSE" | pbcopy
else
  echo "Error: No clipboard tool found (install xclip for Linux or pbcopy for macOS)"
  exit 1
fi

echo "Response copied to clipboard."