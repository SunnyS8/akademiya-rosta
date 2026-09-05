@echo off  
powershell -Command " Invoke-RestMethod -Uri https://akademiya-rosta-6gr2vz2q4-sunnys8s-projects.vercel.app/api/chat -Method Post -Body {""messages"":[{""role"":""user"",""content"":""Привет""}]} -ContentType application/json "  
