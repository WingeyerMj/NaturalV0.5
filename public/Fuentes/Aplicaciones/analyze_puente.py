import sys
f = open('FV_aplicaciones.csv', 'r', encoding='iso-8859-1')
h = f.readline().split(';')
for line in f:
    cols = line.split(';')
    if len(cols) > 1:
        if 'PUENTE ALTO' in cols[24].upper() and 'PRESU' in cols[58].upper() and 'POS' in cols[58].upper():
            print(f"ID Faena: {cols[1]} | Qty: {cols[12]}")
f.close()
