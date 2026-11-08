import os
import re
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

def get_col_widths(num_cols, headers):
    total_w = 6.27
    header_str = " ".join(headers).lower()
    
    if num_cols == 2:
        if "field" in header_str or "term" in header_str:
            return [1.8, 4.47]
        return [2.5, 3.77]
    elif num_cols == 3:
        if "section no." in header_str:
            return [1.1, 3.87, 1.3]
        if "cost" in header_str:
            return [2.5, 1.5, 2.27]
        if "operational environment" in header_str:
            return [1.8, 2.2, 2.27]
        if "maintenance" in header_str:
            return [1.5, 2.77, 2.0]
        if "evaluation dimension" in header_str:
            return [1.6, 1.6, 3.07]
        return [1.5, 2.5, 2.27]
    elif num_cols == 4:
        if "requirement id" in header_str:
            return [1.0, 1.5, 2.87, 0.9] # FR-01 Table
        if "sdlc" in header_str and "model" in header_str:
            return [1.1, 1.8, 2.0, 1.37]
        if "cost" in header_str:
            return [2.2, 1.3, 1.3, 1.47]
        if "testing level" in header_str:
            return [1.3, 2.0, 1.5, 1.47]
        if "sub-process" in header_str:
            return [0.9, 1.8, 1.9, 1.67]
        if "id" in header_str and "quality" in header_str:
            return [0.8, 1.4, 2.67, 1.4] # NFR Table
        return [1.2, 1.7, 2.1, 1.27]
    elif num_cols == 5:
        if "test id" in header_str:
            return [0.75, 1.1, 2.0, 1.72, 0.7] # Test Cases
        if "entity name" in header_str:
            return [1.2, 1.1, 1.0, 1.0, 1.97] # Data Dictionary
        if "risk id" in header_str:
            return [0.8, 1.6, 1.1, 1.97, 0.8] # Risk Register
        if "use case id" in header_str:
            return [1.3, 1.1, 1.1, 1.6, 1.17] # Use Case Table
        if "process id" in header_str:
            return [0.8, 1.5, 1.6, 1.1, 1.27] # DFD Table
        return [0.9, 1.3, 1.7, 1.3, 1.07]
    else:
        w = total_w / num_cols
        return [w] * num_cols

def create_report_docx(md_path, docx_path):
    print(f"Reading markdown from {md_path}...")
    with open(md_path, 'r', encoding='utf-8') as f:
        md_text = f.read()

    doc = docx.Document()

    # --- Page Setup (A4, 1-inch margins) ---
    section = doc.sections[0]
    section.page_width = Inches(8.27)   # A4 Width
    section.page_height = Inches(11.69) # A4 Height
    section.top_margin = Inches(1.0)
    section.bottom_margin = Inches(1.0)
    section.left_margin = Inches(1.0)
    section.right_margin = Inches(1.0)

    # Base Normal Style
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(11)
    normal_style.font.color.rgb = RGBColor(0x22, 0x22, 0x22)
    normal_style.paragraph_format.line_spacing = 1.15
    normal_style.paragraph_format.space_after = Pt(4)

    # Header & Footer setup
    header = section.header
    hp = header.paragraphs[0]
    hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    hrun = hp.add_run("Visitor Management System (VMS) — Academic Project Report | Adamas University")
    hrun.font.name = 'Calibri'
    hrun.font.size = Pt(8.5)
    hrun.font.color.rgb = RGBColor(0x71, 0x80, 0x96)

    footer = section.footer
    fp = footer.paragraphs[0]
    fp.alignment = WD_ALIGN_PARAGRAPH.LEFT
    frun_left = fp.add_run("Dept. of Computer Applications, BCA | Prithwiraj Mazumdar (UG/02/BCA/2023/036)")
    frun_left.font.name = 'Calibri'
    frun_left.font.size = Pt(8.5)
    frun_left.font.color.rgb = RGBColor(0x71, 0x80, 0x96)
    
    # Add tab and page number to footer
    fp.paragraph_format.tab_stops.add_tab_stop(Inches(6.27))
    frun_tab = fp.add_run("\tPage ")
    frun_tab.font.name = 'Calibri'
    frun_tab.font.size = Pt(8.5)
    frun_tab.font.color.rgb = RGBColor(0x71, 0x80, 0x96)

    # Dynamic Page Number Field
    fld1 = parse_xml(r'<w:fldSimple %s w:instr="PAGE"/>' % nsdecls('w'))
    fp._p.append(fld1)
    frun_of = fp.add_run(" of ")
    frun_of.font.name = 'Calibri'
    frun_of.font.size = Pt(8.5)
    frun_of.font.color.rgb = RGBColor(0x71, 0x80, 0x96)
    fld2 = parse_xml(r'<w:fldSimple %s w:instr="NUMPAGES"/>' % nsdecls('w'))
    fp._p.append(fld2)

    # Helper XML functions
    def set_cell_background(cell, fill_hex):
        shading = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
        cell._tc.get_or_add_tcPr().append(shading)

    def set_cell_margins(cell, top=100, bottom=100, left=140, right=140):
        tcPr = cell._tc.get_or_add_tcPr()
        tcMar = parse_xml(f'''
            <w:tcMar {nsdecls("w")}>
                <w:top w:w="{top}" w:type="dxa"/>
                <w:bottom w:w="{bottom}" w:type="dxa"/>
                <w:left w:w="{left}" w:type="dxa"/>
                <w:right w:w="{right}" w:type="dxa"/>
            </w:tcMar>
        ''')
        tcPr.append(tcMar)

    def set_table_borders(table, color="D1D5DB", header_bottom="1B365D"):
        tblPr = table._tbl.tblPr
        borders = parse_xml(f'''
            <w:tblBorders {nsdecls("w")}>
                <w:top w:val="single" w:sz="6" w:space="0" w:color="{color}"/>
                <w:bottom w:val="single" w:sz="8" w:space="0" w:color="{header_bottom}"/>
                <w:left w:val="none"/>
                <w:right w:val="none"/>
                <w:insideH w:val="single" w:sz="4" w:space="0" w:color="{color}"/>
                <w:insideV w:val="none"/>
            </w:tblBorders>
        ''')
        tblPr.append(borders)

    def format_runs(paragraph, text, base_font_size=11, base_color=(0x22, 0x22, 0x22), italic_override=False):
        tokens = re.split(r'(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)', text)
        for token in tokens:
            if not token:
                continue
            if token.startswith('**') and token.endswith('**'):
                run = paragraph.add_run(token[2:-2])
                run.bold = True
                run.font.name = 'Calibri'
                run.font.size = Pt(base_font_size)
                run.font.color.rgb = RGBColor(*base_color)
            elif token.startswith('*') and token.endswith('*'):
                run = paragraph.add_run(token[1:-1])
                run.italic = True
                run.font.name = 'Calibri'
                run.font.size = Pt(base_font_size)
                run.font.color.rgb = RGBColor(*base_color)
            elif token.startswith('`') and token.endswith('`'):
                run = paragraph.add_run(token[1:-1])
                run.font.name = 'Consolas'
                run.font.size = Pt(base_font_size - 0.5)
                run.font.color.rgb = RGBColor(0x99, 0x22, 0x33)
            else:
                clean_text = token.replace(r'\text{', '').replace(r'}', '')
                clean_text = clean_text.replace(r'\le', '≤').replace(r'\ge', '≥').replace(r'\approx', '≈')
                clean_text = clean_text.replace(r'\times', '×').replace(r'\rightarrow', '→')
                run = paragraph.add_run(clean_text)
                if italic_override:
                    run.italic = True
                run.font.name = 'Calibri'
                run.font.size = Pt(base_font_size)
                run.font.color.rgb = RGBColor(*base_color)

    # --- Split Markdown into Blocks ---
    lines = md_text.split('\n')
    i = 0
    total_lines = len(lines)
    is_cover_page = True

    while i < total_lines:
        line = lines[i].rstrip()

        # Handle page breaks
        if '<div style="page-break-after: always;"></div>' in line or (line == '---' and is_cover_page and i > 25):
            doc.add_page_break()
            is_cover_page = False
            i += 1
            continue

        # Handle horizontal rules
        if line == '---':
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(6)
            p.paragraph_format.space_after = Pt(6)
            run = p.add_run("_________________________________________________________________________________")
            run.font.name = 'Calibri'
            run.font.size = Pt(8)
            run.font.color.rgb = RGBColor(0xCB, 0xD5, 0xE1)
            i += 1
            continue

        # Handle Code Blocks & Mermaid Diagrams
        if line.startswith('```'):
            code_type = line[3:].strip()
            i += 1
            code_lines = []
            while i < total_lines and not lines[i].startswith('```'):
                code_lines.append(lines[i])
                i += 1
            i += 1 # Skip closing ```
            
            code_text = '\n'.join(code_lines)
            
            # Format Code Block as a styled callout box in Word
            code_table = doc.add_table(rows=1, cols=1)
            code_table.alignment = WD_TABLE_ALIGNMENT.CENTER
            cell = code_table.rows[0].cells[0]
            cell.width = Inches(6.27)
            set_cell_background(cell, "F8FAFC")
            set_cell_margins(cell, top=120, bottom=120, left=160, right=160)
            
            tcPr = cell._tc.get_or_add_tcPr()
            border_color = "1B365D" if "mermaid" in code_type else "CBD5E1"
            borders = parse_xml(f'''
                <w:tcBorders {nsdecls("w")}>
                    <w:top w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
                    <w:bottom w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
                    <w:left w:val="single" w:sz="24" w:space="0" w:color="{border_color}"/>
                    <w:right w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
                </w:tcBorders>
            ''')
            tcPr.append(borders)
            
            cp = cell.paragraphs[0]
            cp.paragraph_format.space_before = Pt(2)
            cp.paragraph_format.space_after = Pt(2)
            cp.paragraph_format.line_spacing = 1.05
            
            if code_type:
                tag_run = cp.add_run(f"[{code_type.upper()} SPECIFICATION & ARCHITECTURAL MODEL]\n")
                tag_run.bold = True
                tag_run.font.name = 'Consolas'
                tag_run.font.size = Pt(8.5)
                tag_run.font.color.rgb = RGBColor(0x1B, 0x36, 0x5D)

            crun = cp.add_run(code_text)
            crun.font.name = 'Consolas'
            crun.font.size = Pt(8.5)
            crun.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)
            
            sp = doc.add_paragraph()
            sp.paragraph_format.space_before = Pt(0)
            sp.paragraph_format.space_after = Pt(4)
            continue

        # Handle Markdown Tables
        if line.startswith('|') and '|' in line[1:]:
            table_lines = []
            while i < total_lines and lines[i].startswith('|'):
                table_lines.append(lines[i])
                i += 1
            
            if len(table_lines) >= 2:
                headers = [c.strip() for c in table_lines[0].strip().strip('|').split('|')]
                
                sep_idx = 1
                if len(table_lines) > 1 and re.match(r'^[|\s:-]+$', table_lines[1]):
                    sep_idx = 2
                
                data_rows = []
                for r_line in table_lines[sep_idx:]:
                    if r_line.strip():
                        cells = [c.strip() for c in r_line.strip().strip('|').split('|')]
                        if len(cells) < len(headers):
                            cells.extend([''] * (len(headers) - len(cells)))
                        data_rows.append(cells[:len(headers)])

                # Create Word Table
                table = doc.add_table(rows=len(data_rows) + 1, cols=len(headers))
                table.alignment = WD_TABLE_ALIGNMENT.CENTER
                table.autofit = False
                set_table_borders(table)

                col_widths = get_col_widths(len(headers), headers)

                # Format Header Row
                hdr_row = table.rows[0]
                hdr_tr = hdr_row._tr.get_or_add_trPr()
                hdr_tr.append(parse_xml(f'<w:tblHeader {nsdecls("w")}/>'))
                hdr_tr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))
                
                for col_idx, header_text in enumerate(headers):
                    cell = hdr_row.cells[col_idx]
                    cell.width = Inches(col_widths[col_idx])
                    set_cell_background(cell, "1B365D")
                    set_cell_margins(cell, top=120, bottom=120, left=140, right=140)
                    cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
                    p = cell.paragraphs[0]
                    p.paragraph_format.space_before = Pt(1)
                    p.paragraph_format.space_after = Pt(1)
                    p.paragraph_format.line_spacing = 1.05
                    format_runs(p, header_text, base_font_size=9.5, base_color=(0xFF, 0xFF, 0xFF))

                # Format Data Rows
                for row_idx, r_data in enumerate(data_rows):
                    row = table.rows[row_idx + 1]
                    trPr = row._tr.get_or_add_trPr()
                    trPr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))
                    bg_color = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
                    
                    for col_idx, cell_value in enumerate(r_data):
                        cell = row.cells[col_idx]
                        cell.width = Inches(col_widths[col_idx])
                        set_cell_background(cell, bg_color)
                        set_cell_margins(cell, top=90, bottom=90, left=140, right=140)
                        cell.vertical_alignment = WD_ALIGN_VERTICAL.TOP
                        p = cell.paragraphs[0]
                        p.paragraph_format.space_before = Pt(1)
                        p.paragraph_format.space_after = Pt(1)
                        p.paragraph_format.line_spacing = 1.05

                        sub_lines = re.split(r'<br\s*/?>', cell_value)
                        for s_idx, s_text in enumerate(sub_lines):
                            if s_idx > 0:
                                p = cell.add_paragraph()
                                p.paragraph_format.space_before = Pt(1)
                                p.paragraph_format.space_after = Pt(1)
                                p.paragraph_format.line_spacing = 1.05
                            format_runs(p, s_text.strip(), base_font_size=9.5, base_color=(0x22, 0x22, 0x22))

                sp = doc.add_paragraph()
                sp.paragraph_format.space_before = Pt(0)
                sp.paragraph_format.space_after = Pt(6)
            continue

        # Handle Headings
        if line.startswith('# '):
            text = line[2:].strip()
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(16)
            p.paragraph_format.space_after = Pt(6)
            p.paragraph_format.keep_with_next = True
            if is_cover_page:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                format_runs(p, text, base_font_size=22, base_color=(0x1B, 0x36, 0x5D))
            else:
                format_runs(p, text, base_font_size=18, base_color=(0x1B, 0x36, 0x5D))
            i += 1
            continue

        if line.startswith('## '):
            text = line[3:].strip()
            
            # Major numbered sections (1. through 25.) trigger page break
            if re.match(r'^\d+\.\s+', text):
                if not is_cover_page:
                    doc.add_page_break()
            
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(14)
            p.paragraph_format.space_after = Pt(6)
            p.paragraph_format.keep_with_next = True
            format_runs(p, text, base_font_size=15, base_color=(0x1B, 0x36, 0x5D))
            i += 1
            continue

        if line.startswith('### '):
            text = line[4:].strip()
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(10)
            p.paragraph_format.space_after = Pt(4)
            p.paragraph_format.keep_with_next = True
            if is_cover_page:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                format_runs(p, text, base_font_size=13, base_color=(0x2B, 0x54, 0x7E))
            else:
                format_runs(p, text, base_font_size=12.5, base_color=(0x2B, 0x54, 0x7E))
            i += 1
            continue

        if line.startswith('#### '):
            text = line[5:].strip()
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(8)
            p.paragraph_format.space_after = Pt(3)
            p.paragraph_format.keep_with_next = True
            format_runs(p, text, base_font_size=11, base_color=(0x33, 0x33, 0x33))
            i += 1
            continue

        # Handle Blockquotes
        if line.startswith('> '):
            text = line[2:].strip()
            p = doc.add_paragraph()
            p.paragraph_format.left_indent = Inches(0.4)
            p.paragraph_format.space_before = Pt(3)
            p.paragraph_format.space_after = Pt(3)
            format_runs(p, text, base_font_size=10.5, base_color=(0x4A, 0x55, 0x68), italic_override=True)
            i += 1
            continue

        # Handle Bulleted Lists
        if line.startswith('- ') or line.startswith('* ') or line.startswith('• '):
            text = line[2:].strip()
            p = doc.add_paragraph(style='List Bullet')
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.line_spacing = 1.12
            format_runs(p, text, base_font_size=10.5)
            i += 1
            continue

        # Handle Numbered Lists
        num_match = re.match(r'^(\d+)\.\s+(.*)$', line)
        if num_match:
            text = num_match.group(2).strip()
            p = doc.add_paragraph(style='List Number')
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.line_spacing = 1.12
            format_runs(p, text, base_font_size=10.5)
            i += 1
            continue

        # Handle Math blocks
        if line.startswith('$$') and line.endswith('$$'):
            math_text = line[2:-2].strip()
            clean_math = math_text.replace(r'\text{', '').replace(r'}', '')
            clean_math = clean_math.replace(r'\times', ' × ').replace(r'\le', ' ≤ ').replace(r'\ge', ' ≥ ')
            clean_math = clean_math.replace(r'\approx', ' ≈ ').replace(r'\frac', '').replace('{', '(').replace('}', ')')
            
            p = doc.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(6)
            p.paragraph_format.space_after = Pt(6)
            m_run = p.add_run(clean_math)
            m_run.bold = True
            m_run.font.name = 'Cambria Math'
            m_run.font.size = Pt(11)
            m_run.font.color.rgb = RGBColor(0x1B, 0x36, 0x5D)
            i += 1
            continue

        # Regular Paragraph
        if line.strip():
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(4)
            p.paragraph_format.line_spacing = 1.15
            if is_cover_page:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            format_runs(p, line.strip(), base_font_size=11)
        
        i += 1

    print(f"Saving finalized formatted DOCX to {docx_path}...")
    doc.save(docx_path)
    print("Document successfully created and saved!")

if __name__ == '__main__':
    md_file = r'C:\Users\USER\Desktop\VMS\PROJECT_REPORT.md'
    out_docx1 = r'C:\Users\USER\Desktop\VMS\PROJECT_REPORT.docx'
    out_docx2 = r'C:\Users\USER\Desktop\VMS\Prithwiraj_Mazumdar_BCA_VMS_Project_Report.docx'
    
    create_report_docx(md_file, out_docx1)
    create_report_docx(md_file, out_docx2)
