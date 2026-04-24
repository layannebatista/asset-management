@echo off
cd /d "C:\Users\laycr\Documents\asset-management\rtk-dashboard"
pm2 start ecosystem.config.js --update-env
