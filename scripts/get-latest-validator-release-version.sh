#!/usr/bin/env bash
(
    set -e
    version=$(node -e \
      'fetch("https://api.github.com/repos/anza-xyz/agave/releases").then(res => res.json()).then(rs => { const r = rs.find(r => !r.prerelease && !/alpha|beta|rc/.test(r.tag_name)); if (r) console.log(r.tag_name); });'
    )
    if [ -z $version ]; then
      exit 3
    fi
    echo $version
)
errorCode=$?
if [ $errorCode -ne 0 ]; then
  # Bust the cache with a timestamp if no version could be found.
  echo $(date +%s)
fi