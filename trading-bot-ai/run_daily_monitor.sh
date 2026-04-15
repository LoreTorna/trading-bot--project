#!/bin/bash

# Naviga alla directory dello script Python
cd "$(dirname "$0")"

# Esegui lo script Python per generare il report
python3 daily_monitor.py
