#!/bin/bash

# Function to copy text to clipboard (using xclip or xsel)
copy_to_clipboard() {
  local text="$1"
  if command -v xclip &> /dev/null; then
    echo -n "$text" | xclip -selection clipboard
  elif command -v xsel &> /dev/null; then
    echo -n "$text" | xsel -b
  else
    echo "Error: xclip or xsel not found. Install one to copy to clipboard."
    return 1
  fi
  return 0
}

# Function to get command history (optionally filtered by keyword)
getCommands() {
  local keyword="$1"
  local num_commands="$2"
  local history_file="$HOME/.bash_history"

  # Check if the history file exists
  if [[ ! -f "$history_file" ]]; then
    echo "Error: History file not found: $history_file"
    return 1
  fi

  # Read the history file
  local history_content=$(cat "$history_file")

  # Filter based on search term (if provided) and remove duplicates
  if [[ -n "$keyword" ]]; then
    echo "$history_content" | grep "$keyword" | tac | awk '!seen[$0]++' | tac | tail -n "$num_commands"
  else
    echo "$history_content" | tac | awk '!seen[$0]++' | tac | tail -n "$num_commands"
  fi
}

# Default number of commands to show
num_commands=10
search_term=""
ask_text=""

# Parse command-line arguments
while getopts "n:s:a:" opt; do
  case "$opt" in
    n)
      num_commands="$OPTARG"
      if [[ ! "$num_commands" =~ ^[0-9]+$ || "$num_commands" -le 0 ]]; then
        echo "Error: -n must be followed by a positive integer."
        exit 1
      fi
      ;;
    s)
      search_term="$OPTARG"
      ;;
    a)
      ask_text="$OPTARG"
      ;;
    \?)
      echo "Usage: $0 [-n number] [-s search_term] [-a ask_text]"
      exit 1
      ;;
  esac
done

# If -ask is provided, call chat.sh with the modified text
if [[ -n "$ask_text" ]]; then
  chat.sh "be concise: $ask_text"
  exit 0
fi

# Get the command history
history_lines=$(getCommands "$search_term" "$num_commands")

# Check if the command retrieval was successful
if [[ $? -ne 0 ]]; then
  exit 1
fi

# Get the line count
line_count=$(echo "$history_lines" | wc -l)

# Display the commands with numbers
if [[ "$line_count" -eq 0 ]]; then
  if [[ -n "$search_term" ]]; then
    echo "No matching commands found for '$search_term'."
  else
    echo "No recent bash history found."
  fi
  exit 1
fi

echo "Recent Commands:"
i=1
while IFS= read -r line; do
  echo "$i. $line"
  recent_commands[$i]="$line"
  i=$((i + 1))
done <<< "$history_lines"

# Prompt the user for selection
read -p "Enter the number of the command to copy: " choice

# Validate the choice
if [[ ! "$choice" =~ ^[0-9]+$ ]]; then
  echo "Invalid input. Please enter a number."
  exit 1
fi

if [[ "$choice" -lt 1 || "$choice" -gt "$line_count" ]]; then
  echo "Invalid choice. Please enter a number between 1 and $line_count."
  exit 1
fi

# Extract the selected command
selected_command="${recent_commands[$choice]}"

# Copy the command to the clipboard
if copy_to_clipboard "$selected_command"; then
  echo "Command copied to clipboard. Use Ctrl+Shift+V to paste."
else
  echo "Failed to copy command to clipboard."
fi

exit 0