# echocmd.sh, a linux command helper

This script retrieves and displays recent bash history, optionally filtered by a keyword. It allows you to select and copy a command to the clipboard.

## Usage

```bash
./echocmd.sh [-n history number] [-s command key word] [-a what command look for]

./chat.sh "prompt"
config LLM in
RESPONSE=$(curl 'https://192.168.2.16:5001/ask' \
  -H 'accept: */*' \
  -H 'accept-language: en-US,en;q=0.9' \
  -H 'content-type: application/json' \
  -H 'priority: u=1, i' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: same-origin' \
  --data-raw "{\"prompt\":\"$TEXT\",\"cache\":true}" \
  --insecure)
