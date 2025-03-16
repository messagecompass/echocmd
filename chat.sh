#!/bin/bash

# Function to escape special characters for JSON
escape_json() {
  local input="$1"
  # Escape backslashes, double quotes, and newlines
  input=$(echo "$input" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | sed ':a;N;$!ba;s/\n/\\n/g')
  echo "$input"
}

# Check if the text argument is provided
# if [ -z "$1" ]; then
#   echo "Usage: $0 <text>"
#   exit 1
# fi

# Extract the text argument
TEXT="$1"

# Check the clipboard for additional text
if command -v xclip &> /dev/null; then
  # Linux (xclip)
  CLIPBOARD_TEXT=$(xclip -o -selection clipboard 2>/dev/null)
elif command -v pbpaste &> /dev/null; then
  # macOS (pbpaste)
  CLIPBOARD_TEXT=$(pbpaste)
else
  echo "Error: No clipboard tool found (install xclip for Linux or pbpaste for macOS)"
  exit 1
fi

# Append clipboard text to the provided text if clipboard is not empty
if [ -n "$CLIPBOARD_TEXT" ]; then
  # Escape special characters in the clipboard text
  CLIPBOARD_TEXT=$(escape_json "$CLIPBOARD_TEXT")
  # Append the escaped clipboard text to the main text
  TEXT="$TEXT\\n$CLIPBOARD_TEXT"
fi

# Escape special characters in the final text
TEXT=$(escape_json "$TEXT")

# Call the curl function with the combined and escaped text
RESPONSE=$(curl -s 'https://192.168.2.16:5001/ask' \
  -H 'accept: */*' \
  -H 'accept-language: en-US,en;q=0.9' \
  -H 'content-type: application/json' \
  -H 'priority: u=1, i' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: same-origin' \
  --data-raw "{\"prompt\":\"$TEXT\",\"cache\":true}" \
  --insecure)

# Print the response to the terminal
echo "API Response:"
echo "$RESPONSE"

# Copy the response to the clipboard
if command -v xclip &> /dev/null; then
  # Linux (xclip)
  echo "$RESPONSE" | xclip -selection clipboard
elif command -v pbcopy &> /dev/null; then
  # macOS (pbcopy)
  echo "$RESPONSE" | pbcopy
else
  echo "Error: No clipboard tool found (install xclip for Linux or pbcopy for macOS)"
  exit 1
fi

echo "Response copied to clipboard."