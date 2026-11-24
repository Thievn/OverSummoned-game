import re
from docx import Document
from docx.shared import Pt
lines = open('bible.md').read().split('\n')
doc = Document()
doc.styles['Normal'].font.name = 'Calibri'
doc.styles['Normal'].font.size = Pt(11)
i = 0
def cells(l): return [c.strip() for c in l.strip().strip('|').split('|')]
while i < len(lines):
    l = lines[i]
    if l.startswith('# '): doc.add_heading(l[2:], 0)
    elif l.startswith('## '): doc.add_heading(l[3:], 1)
    elif l.startswith('### '): doc.add_heading(l[4:], 2)
    elif l.startswith('|'):
        rows = []
        while i < len(lines) and lines[i].startswith('|'):
            if not re.match(r'^\|[\s\-|]+\|$', lines[i]): rows.append(cells(lines[i]))
            i += 1
        n = max(len(r) for r in rows)
        t = doc.add_table(rows=len(rows), cols=n); t.style = 'Table Grid'
        for ri, r in enumerate(rows):
            for ci in range(n):
                c = t.cell(ri, ci); c.text = r[ci] if ci < len(r) else ''
                if ri == 0:
                    for p in c.paragraphs:
                        for run in p.runs: run.bold = True
        doc.add_paragraph()
        continue
    elif l.startswith('- '): doc.add_paragraph(l[2:], style='List Bullet')
    elif re.match(r'^\d+\. ', l): doc.add_paragraph(l)
    elif l.strip(): doc.add_paragraph(l)
    i += 1
doc.save('OverSummoned Bible (Poppy plan).docx')
print('saved')
