@echo off
cd "C:\Users\HAISB STORE\LME-data"

:: خوندن عدد فعلی
set /p version=<version.txt

:: یه واحد زیاد کردن
set /a version=%version%+1

:: نوشتن عدد جدید
echo %version%>version.txt

:: push به GitHub
git add .
git commit -m "update v%version%"
git push

echo Done! Version: %version%
pause