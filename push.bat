@echo off
cd "C:\Users\HAISB STORE\LME-data"

:: Read current versions
for /f "tokens=1,2 delims==" %%a in (version.txt) do set %%a=%%b

:: Check which files changed
git status --short > changed_files.txt
findstr /i /l "LME_database.json" changed_files.txt >nul && set /a LME_database=%LME_database%+1
findstr /i /l "WagonsWithWeight.json" changed_files.txt >nul && set /a WagonsWithWeight=%WagonsWithWeight%+1
findstr /i /l "master_tabel_for_tracks.json" changed_files.txt >nul && set /a trucks=%trucks%+1
findstr /i /l "loaded.json" changed_files.txt >nul && set /a waiting=%waiting%+1
findstr /i /l "ForLoading.json" changed_files.txt >nul && set /a forLoading=%forLoading%+1
findstr /i /l "BalanceCounter.json" changed_files.txt >nul && set /a BalanceCounter=%BalanceCounter%+1
findstr /i /l "BalanceOmomi.json" changed_files.txt >nul && set /a BalanceOmomi=%BalanceOmomi%+1
findstr /i /l "FinancialStatement.json" changed_files.txt >nul && set /a FinancialStatement=%FinancialStatement%+1
findstr /i /l "HajiNadir.json" changed_files.txt >nul && set /a HajiNadir=%HajiNadir%+1
del changed_files.txt

:: Default 0 for any missing version
if not defined HajiNadir set HajiNadir=0

:: Write new versions
(
echo LME_database=%LME_database%
echo WagonsWithWeight=%WagonsWithWeight%
echo trucks=%trucks%
echo waiting=%waiting%
echo forLoading=%forLoading%
echo BalanceCounter=%BalanceCounter%
echo BalanceOmomi=%BalanceOmomi%
echo FinancialStatement=%FinancialStatement%
echo HajiNadir=%HajiNadir%
)>version.txt

git add .
git commit -m "update v%LME_database%-%WagonsWithWeight%-%trucks%-%waiting%-%forLoading%-%BalanceCounter%-%BalanceOmomi%-%FinancialStatement%-%HajiNadir%"
git push

echo Done! Versions: LME=%LME_database% Wagons=%WagonsWithWeight% Trucks=%trucks% Waiting=%waiting% ForLoading=%forLoading% BalanceCounter=%BalanceCounter% BalanceOmomi=%BalanceOmomi% Financial=%FinancialStatement% HajiNadir=%HajiNadir%