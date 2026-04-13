#! /bin/bash

git fetch --all
git stash
git merge origin/main
git stash pop
git push
