from pathlib import Path
import json, csv, shutil
root=Path(__file__).resolve().parent.parent
rows=list(csv.DictReader((root/'02 Bank Export August.csv').open(encoding='utf-8-sig')))
bank=[{'date':r['Date'],'reference':r['Reference'],'description':r['Bank description'],'debit':int(r['Debit EUR'] or 0),'credit':int(r['Credit EUR'] or 0),'balance':int(r['Balance EUR']),'csvRow':i+2} for i,r in enumerate(rows)]
(root/'data/bank.json').write_text(json.dumps(bank,indent=2),encoding='utf-8')
out=root/'public/evidence'
out.mkdir(parents=True,exist_ok=True)
manifest=json.loads((root/'evidence-extracted/manifest.json').read_text())
for item in manifest: shutil.copy2(root/item['file'],out/item['file'])
print('Preserved source copies and 27 typed bank records prepared.')
