#!/bin/bash

CLIPBOARD_TEXT=$(xclip -o -selection clipboard 2>/dev/null)

if [ -n "$CLIPBOARD_TEXT" ]; then
  gnome-terminal -- bash -c "echocmd.sh -a \"$CLIPBOARD_TEXT\"; read -p 'Press Enter to close...'; exit"
else
  echo "nothing in clipboard to ask"
fi

exit 0