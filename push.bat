@echo off
cd "C:\Users\HAISB STORE\LME-data"

:: خوندن version های فعلی
for /f "tokens=1,2 delims==" %%a in (version.txt) do set %%a=%%b

:: چک کردن کدوم فایل تغییر کرده
git status --short > changed_files.txt

findstr /i "LME_database.json" changed_files.txt >nul && set /a LME_database=%LME_database%+1
findstr /i "WagonsWithWeight.json" changed_files.txt >nul && set /a WagonsWithWeight=%WagonsWithWeight%+1
findstr /i "master_tabel_for_tracks.json" changed_files.txt >nul && set /a trucks=%trucks%+1
findstr /i "loaded.json" changed_files.txt >nul && set /a waiting=%waiting%+1

del changed_files.txt

:: نوشتن version های جدید
(
echo LME_database=%LME_database%
echo WagonsWithWeight=%WagonsWithWeight%
echo trucks=%trucks%
echo waiting=%waiting%
)>version.txt

git add .
git commit -m "update v%LME_database%-%WagonsWithWeight%-%trucks%-%waiting%"
git push

echo Done! Versions: LME=%LME_database% Wagons=%WagonsWithWeight% Trucks=%trucks% Waiting=%waiting%