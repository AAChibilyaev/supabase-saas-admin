#!/bin/bash

# ============================================
# TMUX Development Session for Supabase Admin
# ============================================

SESSION_NAME="supabase-admin"
PROJECT_DIR="/home/coder/supabase-admin"

# Check if session already exists
tmux has-session -t $SESSION_NAME 2>/dev/null

if [ $? == 0 ]; then
    echo "Session '$SESSION_NAME' already exists. Attaching..."
    tmux attach -t $SESSION_NAME
    exit 0
fi

echo "Creating new tmux session: $SESSION_NAME"

# Create new session with first window
tmux new-session -d -s $SESSION_NAME -n "editor" -c $PROJECT_DIR

# Window 1: Editor (main development)
tmux send-keys -t $SESSION_NAME:1 "clear" C-m
tmux send-keys -t $SESSION_NAME:1 "# Main Editor - Open files with your favorite editor" C-m
tmux send-keys -t $SESSION_NAME:1 "# Examples:" C-m
tmux send-keys -t $SESSION_NAME:1 "# vim src/App.tsx" C-m
tmux send-keys -t $SESSION_NAME:1 "# code ." C-m

# Window 2: Dev Server (Vite)
tmux new-window -t $SESSION_NAME:2 -n "dev-server" -c $PROJECT_DIR
tmux send-keys -t $SESSION_NAME:2 "clear" C-m
tmux send-keys -t $SESSION_NAME:2 "# Starting Vite dev server..." C-m
tmux send-keys -t $SESSION_NAME:2 "npm run dev" C-m

# Window 3: Build & Lint (split panes)
tmux new-window -t $SESSION_NAME:3 -n "build" -c $PROJECT_DIR
tmux send-keys -t $SESSION_NAME:3 "clear" C-m
tmux send-keys -t $SESSION_NAME:3 "# Build commands:" C-m
tmux send-keys -t $SESSION_NAME:3 "# npm run build" C-m
tmux send-keys -t $SESSION_NAME:3 "# npm run lint" C-m
tmux send-keys -t $SESSION_NAME:3 "# npm run preview" C-m

# Split horizontally for linting
tmux split-window -h -t $SESSION_NAME:3 -c $PROJECT_DIR
tmux send-keys -t $SESSION_NAME:3.2 "clear" C-m
tmux send-keys -t $SESSION_NAME:3.2 "# Lint watcher:" C-m
tmux send-keys -t $SESSION_NAME:3.2 "# npm run lint" C-m

# Window 4: Git & Database
tmux new-window -t $SESSION_NAME:4 -n "git-db" -c $PROJECT_DIR
tmux send-keys -t $SESSION_NAME:4 "clear" C-m
tmux send-keys -t $SESSION_NAME:4 "git status" C-m

# Split for database/supabase operations
tmux split-window -v -t $SESSION_NAME:4 -c $PROJECT_DIR
tmux send-keys -t $SESSION_NAME:4.2 "clear" C-m
tmux send-keys -t $SESSION_NAME:4.2 "# Supabase operations:" C-m
tmux send-keys -t $SESSION_NAME:4.2 "# supabase status" C-m
tmux send-keys -t $SESSION_NAME:4.2 "# supabase db reset" C-m

# Window 5: Logs & Monitoring (4-pane layout)
tmux new-window -t $SESSION_NAME:5 -n "logs" -c $PROJECT_DIR

# Top-left: Application logs
tmux send-keys -t $SESSION_NAME:5 "clear" C-m
tmux send-keys -t $SESSION_NAME:5 "# Application logs" C-m

# Top-right: Network monitoring
tmux split-window -h -t $SESSION_NAME:5 -c $PROJECT_DIR
tmux send-keys -t $SESSION_NAME:5.2 "clear" C-m
tmux send-keys -t $SESSION_NAME:5.2 "# Network monitoring" C-m

# Bottom-left: System resources
tmux split-window -v -t $SESSION_NAME:5.1 -c $PROJECT_DIR
tmux send-keys -t $SESSION_NAME:5.3 "clear" C-m
tmux send-keys -t $SESSION_NAME:5.3 "# System resources" C-m
tmux send-keys -t $SESSION_NAME:5.3 "# htop" C-m

# Bottom-right: Docker/Services
tmux split-window -v -t $SESSION_NAME:5.2 -c $PROJECT_DIR
tmux send-keys -t $SESSION_NAME:5.4 "clear" C-m
tmux send-keys -t $SESSION_NAME:5.4 "# Services status" C-m

# Window 6: Testing
tmux new-window -t $SESSION_NAME:6 -n "tests" -c $PROJECT_DIR
tmux send-keys -t $SESSION_NAME:6 "clear" C-m
tmux send-keys -t $SESSION_NAME:6 "# Test commands:" C-m
tmux send-keys -t $SESSION_NAME:6 "# npm test" C-m
tmux send-keys -t $SESSION_NAME:6 "# npm run test:watch" C-m

# Window 7: Terminal (general purpose)
tmux new-window -t $SESSION_NAME:7 -n "terminal" -c $PROJECT_DIR
tmux send-keys -t $SESSION_NAME:7 "clear" C-m

# Select first window
tmux select-window -t $SESSION_NAME:1

# Attach to session
tmux attach-t $SESSION_NAME
