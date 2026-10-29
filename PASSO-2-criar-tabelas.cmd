@echo off
rem ===========================================================================
rem  DEMOCRAT.IA - Passo 2: criar as tabelas e carregar os dados do manual
rem
rem  Da um duplo clique neste arquivo.
rem  So funciona depois que o passo 1 (conectar) tiver dado certo.
rem
rem  Pode rodar quantas vezes quiser: nao duplica nem apaga nada.
rem ===========================================================================
cd /d "%~dp0"
title DEMOCRAT.IA - Criar tabelas

call npm.cmd run db:instalar

echo.
echo ---------------------------------------------------------------------
echo  Terminou. Pode fechar esta janela.
echo ---------------------------------------------------------------------
pause
