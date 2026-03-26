import sys
f = open('EE_aplicaciones.csv', 'r', encoding='iso-8859-1')
f.readline()
for line in f:
    cols = line.split(';')
    if len(cols) > 62:
        if 'EEII 1' in cols[24].upper() and 'PRESU' in cols[58].upper():
            print(f"Prod: {cols[8]} | Qty: {cols[12]} | N: {cols[60]} | P: {cols[61]} | Ca: {cols[62]}")
f.close()
