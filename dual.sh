#!/bin/sh

pm2 start npm --name server -- run server
pm2 start npm --name dev -- run dev

pm2 logs