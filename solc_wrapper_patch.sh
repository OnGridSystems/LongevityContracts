#!/usr/bin/env bash
read -d "" PATCH <<"EOF"
49c49
<                  allow_paths=None,
---
>                  allow_paths="/",
EOF
echo "$PATCH" | patch $VIRTUAL_ENV/lib/python3.6/site-packages/solc/wrapper.py