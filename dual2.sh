#!/bin/bash
npx concurrently -n "SERVER,BOT" -c "blue,green" "npm run server" "npm run bot"