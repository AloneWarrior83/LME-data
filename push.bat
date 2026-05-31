@echo off
cd "C:\Users\HAISB STORE\LME-data"

set /p version=<version.txt
set /a version=%version%+1
(echo %version%)>version.txt

git add .
git commit -m "update v%version%"
git push