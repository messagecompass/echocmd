CLIPBOARD_TEXT=$(xclip -o -selection clipboard 2>/dev/null)

if [ -n "$CLIPBOARD_TEXT" ]; then
  CLIPBOARD_ESCAPED=$(printf '%s\n' "$CLIPBOARD_TEXT" | sed 's/["]/\\&/g')
  gnome-terminal -- bash -c "echocmd.sh -a \"$CLIPBOARD_ESCAPED\"; read -p 'Press Enter to close...'; exit"
ee
  echo "nothing in clipboard to ask"
fi

exit 0