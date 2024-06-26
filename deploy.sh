#!/bin/bash
set -x;
source /home/ubuntu/.bashrc;


sudo fuser -k 3000/tcp;
sudo fuser -k 8000/tcp;

tmux kill-session -t web_backend;
tmux kill-session -t web_frontend;
tmux kill-session -t dramatiq;

cd /home/ubuntu/rewrite;

git fetch origin;
git reset --hard origin/main;
poetry install;

cd front_end;
npm i;
npm run build;
cd ..;

poetry run python3 manage.py migrate;

export ALPHA_ACCESS_TOKEN="the open source rewrite";

tmux new-session -d -s web_backend;
tmux send-keys -t web_backend 'poetry run python3 manage.py runserver' C-m;
tmux new-session -d -s dramatiq;
tmux send-keys -t dramatiq 'python manage.py rundramatiq --processes 1 --threads 1' C-m;

cd front_end;
tmux new-session -d -s web_frontend;
tmux send-keys -t web_frontend 'npm run start -- -p 3000' C-m;

echo "Deployment script completed.";
