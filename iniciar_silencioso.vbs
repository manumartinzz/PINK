Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")
raiz = fso.GetParentFolderName(WScript.ScriptFullName)
shell.CurrentDirectory = raiz

py = raiz & "\.venv\Scripts\pythonw.exe"
If Not fso.FileExists(py) Then py = raiz & "\.venv\Scripts\python.exe"
If Not fso.FileExists(py) Then py = "python"

shell.Run """" & py & """ """ & raiz & "\app.py"" --no-browser", 0, False
WScript.Sleep 2200

url = "http://127.0.0.1:8765/?autopalmas=1"
flags = " --app=" & url & " --autoplay-policy=no-user-gesture-required"

edge64 = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
edge = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
chrome86 = "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"

If fso.FileExists(edge64) Then
  shell.Run """" & edge64 & """" & flags, 1, False
ElseIf fso.FileExists(edge) Then
  shell.Run """" & edge & """" & flags, 1, False
ElseIf fso.FileExists(chrome) Then
  shell.Run """" & chrome & """" & flags, 1, False
ElseIf fso.FileExists(chrome86) Then
  shell.Run """" & chrome86 & """" & flags, 1, False
Else
  shell.Run "cmd /c start """" """ & url & """", 0, False
End If
