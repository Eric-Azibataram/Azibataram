#!/bin/bash
for f in app.js index.html styles.css; do
  [ -f "$f" ] || { echo "Wrong folder. Go to the main folder (where index.html is) and run again."; exit 1; }
done
echo "--- Applying update 7"; python3 apply_update7.py || true
echo "--- Applying update 8"; python3 apply_update8.py || true
echo "--- Checking"
node -e "new Function(require('fs').readFileSync('app.js','utf8'))" && echo "app.js: OK" || echo "app.js: could not be checked"
echo "admin.js tag in index.html: $(grep -c 'admin.js' index.html)  (should be 1)"
echo "legal.js tag in index.html: $(grep -c 'legal.js' index.html)  (should be 1)"
echo "Done. Now run the SQL files in the sql folder, in number order."
