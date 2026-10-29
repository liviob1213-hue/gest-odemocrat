@echo off
rem ===========================================================================
rem  DEMOCRAT.IA - Passo 1: conectar o sistema ao banco do Supabase
rem
rem  Da um duplo clique neste arquivo.
rem
rem  Usa npm.cmd (e nao npm) de proposito: no PowerShell o "npm" e um script
rem  que costuma vir bloqueado pela politica de seguranca do Windows.
rem ===========================================================================
cd /d "%~dp0"
title DEMOCRAT.IA - Conectar banco

call npm.cmd run db:conectar

echo.
echo ---------------------------------------------------------------------
echo  Terminou. Pode fechar esta janela.
echo ---------------------------------------------------------------------
pause
