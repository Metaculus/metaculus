#!/bin/bash

# 0. Kill the tmux session named 'web_backend'
tmux kill-session -t web_backend;

# 1. Kill the tmux session named 'web_frontend'
tmux kill-session -t web_frontend;

# 2. Change directory to 'rewrite'
cd /home/ubuntu/rewrite;

# 3. Pull the latest from main with overwrite
git fetch origin;
git reset --hard origin/main;
poetry install;

# 4. Install new poetry dependencies and new node dependencies in 'front_end' and run `npm run build`
cd front_end;
npm i;
npm run dev;
cd ..;

# 5. Run django migrations with poetry
poetry run python3 manage.py migrate;

export ALPHA_ACCESS_TOKEN="the open source rewrite";

# 7. Start a `web_backend` tmux session and run the Django server
tmux new-session -d -s web_backend;
tmux send-keys -t web_backend 'poetry run python3 manage.py runserver' C-m;

# 8. Go to 'front_end' and start the `web_frontend` tmux session and run the Next.js frontend server
cd front_end;
tmux new-session -d -s web_frontend;
tmux send-keys -t web_frontend 'npm run start -- -p 3000' C-m;

echo "Deployment script completed.";
