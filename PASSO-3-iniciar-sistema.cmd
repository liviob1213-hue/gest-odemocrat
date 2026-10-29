@echo off
rem ===========================================================================
rem  DEMOCRAT.IA - Passo 3: abrir o sistema
rem
rem  Da um duplo clique neste arquivo e depois abra no navegador:
rem
rem      http://localhost:3000
rem
rem  Deixe esta janela ABERTA enquanto estiver usando o sistema.
rem  Para desligar: feche a janela ou aperte Ctrl+C.
rem ===========================================================================
cd /d "%~dp0"
title DEMOCRAT.IA - Sistema rodando (nao feche enquanto estiver usando)

echo.
echo  Subindo o sistema...
echo  Quando aparecer "Ready", abra no navegador:  http://localhost:3000
echo.

call npm.cmd run dev

echo.
echo ---------------------------------------------------------------------
echo  O sistema foi desligado.
echo ---------------------------------------------------------------------
pause
