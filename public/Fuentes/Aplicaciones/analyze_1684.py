import sys
search_prod = '1684'
f = open('EE_aplicaciones.csv', 'r', encoding='iso-8859-1')
h = f.readline().split(';')
for line in f:
    cols = line.split(';')
    if len(cols) > 58:
        if search_prod in cols[8]:
            tipo = cols[58].lower()
            if 'presu' in tipo or 'ppto' in tipo:
                print(f"Prod: {cols[8]} | Clasifica: {cols[24]} | Qty: {cols[12]} | Tipo: {cols[58]}")
f.close()
