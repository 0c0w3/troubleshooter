#!/bin/bash

BASENAME_PREFIX="troubleshooter"
GIT_IGNORE="$HOME/.gitignore"

hash=$(git log -n 1 --format=format:%h)
basename="$BASENAME_PREFIX-$hash"
if git status --short | awk '{ print $1 }' | fgrep -qv '??'; then
  basename="$basename-modified"
fi
filename="$basename.xpi"
echo $filename

exclude=""
if [ -f "$GIT_IGNORE" ]; then
  exclude="-x@$GIT_IGNORE"
fi
cd src
zip -r "../$filename" . $exclude
cd ..

# ignore=""
# if [ -f "$HOME/.gitignore" ]; then
#   while read line; do
#     if [[ ! -z "$line" && ${line:0:1} != "#" ]]; then
#       echo "**** $line"
#       ignore="$ignore -not -name $line"
#     fi
#   done < "$HOME/.gitignore"
# fi
# files=$(echo "$ignore" | xargs find .)
# echo $files
