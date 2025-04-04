#!/bin/bash

# Define the API endpoint
API_URL='http://192.168.2.16:8081/v1/chat/completions'

# Get the second message content from the clipboard
USER_CONTENT=$(xclip -selection clipboard -o 2>/dev/null)

# Check if the clipboard content is empty
if [ -z "$USER_CONTENT" ]; then
  echo "Clipboard is empty, cannot post empty content."
else
  # Escape the user content for JSON (including newlines)
  ESCAPED_USER_CONTENT=$(printf '%s' "$USER_CONTENT" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g' -e ':a;N;$!ba;s/\n/\\n/g')

  # Construct the raw JSON data
  RAW_DATA=$(cat <<EOF
{
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant, please be very concise, reply in least words"
    },
    {
      "role": "user",
      "content": "$ESCAPED_USER_CONTENT"
    }
  ],
  "stream": false,
  "cache_prompt": true,
  "samplers": "edkypmxt",
  "temperature": 0.8,
  "dynatemp_range": 0,
  "dynatemp_exponent": 1,
  "top_k": 40,
  "top_p": 0.95,
  "min_p": 0.05,
  "typical_p": 1,
  "xtc_probability": 0,
  "xtc_threshold": 0.1,
  "repeat_last_n": 64,
  "repeat_penalty": 1,
  "presence_penalty": 0,
  "frequency_penalty": 0,
  "dry_multiplier": 0,
  "dry_base": 1.75,
  "dry_allowed_length": 2,
  "dry_penalty_last_n": -1,
  "max_tokens": -1,
  "timings_per_token": false
}
EOF
)

  # Call the API using curl with the API_URL variable
  RESPONSE=$(curl -s -X POST \
    -H 'Accept: */*' \
    -H 'Accept-Language: en-US,en;q=0.9' \
    -H 'Connection: keep-alive' \
    -H 'Content-Type: application/json' \
    --data-raw "$RAW_DATA" \
    --insecure \
    "$API_URL"
  )

CONTENT=$(echo "$RESPONSE" | grep -o '"content":"[^"]*"' | awk -F':' '{print $2}' | sed 's/^"//;s/"$//')

if [ -n "$CONTENT" ]; then
  gnome-terminal -- bash -c "echo \"$CONTENT\"; read -p 'Press Enter to close...'; exit"
else
  gnome-terminal -- bash -c 'echo "Could not extract content from the response."; read -p "Press Enter to close..."; exit'
fi

fi
