import sys
f = open('EE_aplicaciones.csv', 'r', encoding='iso-8859-1')
f.readline()
for line in f:
    cols = line.split(';')
    if len(cols) > 58:
        if 'presupuestado-pos' in cols[58].lower():
            print(f"Prod: {cols[8]} | Clasifica: {cols[24]} | Qty: {cols[12]}")
f.close()
