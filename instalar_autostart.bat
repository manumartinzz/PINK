@echo off
cd /d "%~dp0"
if not exist .venv (
  echo Criando ambiente da Pink pela primeira vez...
  python -m venv .venv
  call .venv\Scripts\activate
  pip install -r requirements.txt
)
if not exist .env copy .env.example .env >nul

powershell -NoProfile -Command "$s=(New-Object -ComObject WScript.Shell).CreateShortcut(\"$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\Pink.lnk\"); $s.TargetPath='wscript.exe'; $s.Arguments='//B \"%~dp0iniciar_silencioso.vbs\"'; $s.WorkingDirectory='%~dp0'; $s.Save()"

echo.
echo  Pronto! A Pink foi configurada para iniciar junto com o Windows.
echo  1) Na primeira vez que ela abrir, libere o microfone com "Permitir ao visitar o site".
echo  2) Nas proximas vezes, ela abre sozinha ja ouvindo suas 2 palmas sem precisar clicar!
echo.
echo  Iniciando a Pink agora para voce testar...
wscript.exe //B "%~dp0iniciar_silencioso.vbs"
pause
