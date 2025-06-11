#!/bin/sh

pm2 start npm --name server -- run server
pm2 start npm --name bot -- run bot

pm2 logs