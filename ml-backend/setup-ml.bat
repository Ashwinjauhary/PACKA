@echo off
echo ==================================================
echo PACKA ML Backend Setup Script
echo ==================================================

echo 1. Creating Python Virtual Environment (venv)...
python -m venv venv

echo 2. Activating Virtual Environment...
call venv\Scripts\activate.bat

echo 3. Installing dependencies... (This may take a few minutes)
pip install -r requirements.txt

echo ==================================================
echo Setup Complete! 
echo To run the ML Server, use the following commands:
echo cd ml-backend
echo call venv\Scripts\activate.bat
echo uvicorn main:app --host 0.0.0.0 --port 8000
echo ==================================================
pause
