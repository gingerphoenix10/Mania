#!/bin/bash

# Script to convert an MP3 file to Base64 and wrap it with a prefix and suffix
# Usage: ./mp3_to_base64.sh input.mp3 output.txt

# Check arguments
if [ $# -ne 3 ]; then
  echo "Usage: $0 input.mp3 prefix.txt suffix.txt" exit 1
fi
  INPUT_FILE="$1"
  PRO_FILE="$2"
  SUF_FILE="$3"

  # Convert to base64 and wrap with prefix/suffix
  { cat "$PRO_FILE" base64 "$INPUT_FILE" cat "$SUF_FILE" } > "$OUTPUT_FILE" echo "Base64 encoded file created: $OUTPUT_FILE"
