#!/bin/bash

hash=$(git log -n 1 --format=format:%h)
basename="troubleshoot-helper-$hash"
if git status --short | awk '{ print $1 }' | fgrep -qv '??'; then
  basename="$basename-modified"
fi
filename="$basename.xpi"
echo $filename

gitignore="$HOME/.gitignore"
exclude=""
if [ -f "$gitignore" ]; then
  exclude="-x@$gitignore"
fi
cd content
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
