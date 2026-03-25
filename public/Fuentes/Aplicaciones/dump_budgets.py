import sys
f = open('EE_aplicaciones.csv', 'r', encoding='iso-8859-1')
f.readline()
for line in f:
    cols = line.split(';')
    if len(cols) > 58:
        if 'PRESU' in cols[58].upper():
             print(f"Predio: {cols[24]} | Prod: {cols[8]} | Qty: {cols[12]} | N: {cols[60]} | P: {cols[61]} | Ca: {cols[62]}")
f.close()
