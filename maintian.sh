#! /bin/bash

git fetch --all
git stash
git merge upstream/main
git stash pop
git push
