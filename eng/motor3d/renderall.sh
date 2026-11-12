#!/bin/bash
cd "$(dirname "$0")"
N=$(python3 -c "import json;print(json.load(open('work/timing.json'))['frames'])")
step=285; i=0
for ((a=0; a<N; a+=step)); do b=$((a+step-1)); [ $b -ge $N ] && b=$((N-1)); f=$(printf "scenes/s%02d.mp4" $i)
  if [ ! -f $f ]; then node render.mjs video $f $a $b 2>&1 | grep -E "done|ERR|fail"; fi; echo "$f $a-$b"; i=$((i+1)); done
echo ALLDONE
