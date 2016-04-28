#!/usr/bin/env bash
KEYS_DIR=/gitbook-public-keys
KEYS_FILE=/root/.ssh/authorized_keys

if [ -d $KEYS_DIR ]; then
  for KEY in $(ls -1 $KEYS_DIR/*.pub); do
    cat $KEY >> $KEYS_FILE
    echo "Added $KEY to $KEYS_FILE"
  done
fi
