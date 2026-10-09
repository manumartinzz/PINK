@echo off
cd /d "%~dp0"
if not exist .venv (
  echo Criando ambiente da Pink pela primeira vez...
  python -m venv .venv
  call .venv\Scripts\activate
  pip install -r requirements.txt
) else (
  call .venv\Scripts\activate
)
if not exist .env copy .env.example .env >nul
python app.py
pause
