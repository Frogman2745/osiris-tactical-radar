import { jsPDF } from 'jspdf';

export interface PdfExportOptions {
  reportVersion: number;
  lastAuthor: string;
  lastUpdated: string;
  title?: string;
}

export interface KpiMetric {
  label: string;
  value: string;
  color: [number, number, number]; // RGB
}

export const exportMarkdownToTacticalPdf = async (
  markdown: string,
  options: PdfExportOptions
): Promise<void> => {
  // Letter size: 612 x 792 pt
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter',
  });

  const pageWidth = 612;
  const pageHeight = 792;
  const marginX = 40;
  const contentWidth = pageWidth - marginX * 2; // 532 pt
  const topHeaderMargin = 78;
  const bottomFooterMargin = 735;

  // Futuristic Dark War-Room Color Palette
  const colors = {
    bg: [11, 15, 25] as [number, number, number],          // #0B0F19 deep war room void
    cardBg: [17, 24, 39] as [number, number, number],      // #111827
    cardBorder: [30, 41, 59] as [number, number, number],  // #1E293B
    cyanPrimary: [6, 182, 212] as [number, number, number], // #06B6D4
    cyanBright: [34, 211, 238] as [number, number, number], // #22D3EE
    skyAccent: [56, 189, 248] as [number, number, number],  // #38BDF8
    textWhite: [248, 250, 252] as [number, number, number], // #F8FAFC
    textLight: [203, 213, 225] as [number, number, number], // #CBD5E1
    textMuted: [148, 163, 184] as [number, number, number], // #94A3B8
    textDark: [100, 116, 139] as [number, number, number],  // #64748B
    amber: [245, 158, 11] as [number, number, number],      // #F59E0B
    emerald: [16, 185, 129] as [number, number, number],   // #10B981
    red: [239, 68, 68] as [number, number, number],         // #EF4444
  };

  // Helper to draw corner reticles
  const drawCornerReticle = (x: number, y: number, size: number = 8) => {
    doc.setDrawColor(colors.cyanPrimary[0], colors.cyanPrimary[1], colors.cyanPrimary[2]);
    doc.setLineWidth(0.8);
    // Crosshair
    doc.line(x - size, y, x + size, y);
    doc.line(x, y - size, x, y + size);
    // Center point
    doc.setFillColor(colors.cyanBright[0], colors.cyanBright[1], colors.cyanBright[2]);
    doc.circle(x, y, 1, 'F');
  };

  // Function to decorate page background and tactical header/footer frames
  const decorateTacticalPage = (pageNum: number, totalPages: number) => {
    // 1. Deep Void Background Fill
    doc.setFillColor(colors.bg[0], colors.bg[1], colors.bg[2]);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // 2. Corner Alignment Crosshairs
    drawCornerReticle(24, 22, 6);
    drawCornerReticle(pageWidth - 24, 22, 6);
    drawCornerReticle(24, pageHeight - 22, 6);
    drawCornerReticle(pageWidth - 24, pageHeight - 22, 6);

    // 3. Top Cyan Laser Glow Line
    doc.setDrawColor(colors.cyanBright[0], colors.cyanBright[1], colors.cyanBright[2]);
    doc.setLineWidth(1.8);
    doc.line(marginX, 20, marginX + contentWidth, 20);

    // 4. Classification & Clearance Banner Pill
    doc.setFillColor(24, 18, 10);
    doc.rect(marginX, 25, 330, 14, 'F');
    doc.setDrawColor(colors.amber[0], colors.amber[1], colors.amber[2]);
    doc.setLineWidth(0.5);
    doc.rect(marginX, 25, 330, 14, 'S');

    doc.setFont('courier', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(colors.amber[0], colors.amber[1], colors.amber[2]);
    doc.text('▲ TOP SECRET // TACTICAL AIR OPS // CAL FIRE & USFS DISPATCH', marginX + 6, 35);

    // Document Control ID
    doc.setFont('courier', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(colors.cyanBright[0], colors.cyanBright[1], colors.cyanBright[2]);
    doc.text(`DOC-ID: AXIOM-BI-DEF-${options.reportVersion.toString().padStart(4, '0')}`, marginX + contentWidth - 140, 35);

    // Operational Subheader
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
    doc.text('CALIFORNIA DEPARTMENT OF FORESTRY & FIRE PROTECTION · SACRAMENTO HQ', marginX, 52);

    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    const ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
    doc.text(`OP-VERSION: v${options.reportVersion}  |  AUTHOR: ${options.lastAuthor}  |  SYNC: ${ts} UTC`, marginX, 63);

    // Top Header Dividing Line
    doc.setDrawColor(colors.cardBorder[0], colors.cardBorder[1], colors.cardBorder[2]);
    doc.setLineWidth(0.8);
    doc.line(marginX, 70, marginX + contentWidth, 70);

    // Cyan glowing indicator pip
    doc.setFillColor(colors.cyanBright[0], colors.cyanBright[1], colors.cyanBright[2]);
    doc.circle(marginX + 2, 70, 2.5, 'F');

    // 5. Tactical Bottom Footer
    doc.setDrawColor(colors.cardBorder[0], colors.cardBorder[1], colors.cardBorder[2]);
    doc.setLineWidth(0.8);
    doc.line(marginX, bottomFooterMargin, marginX + contentWidth, bottomFooterMargin);

    // Footer Barcode simulation & telemetry string
    doc.setFont('courier', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
    doc.text('||||| ||| ||||||| || |||||| |||||  [AXIOM-BI STATEWIDE AIR DEFENSE NET]', marginX, bottomFooterMargin + 14);

    doc.setFont('courier', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    doc.text('CLASSIFICATION: CONFIDENTIAL // TACTICAL AIR DISPATCH', marginX + 200, bottomFooterMargin + 14);

    // Page numbering
    doc.setFont('courier', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(colors.cyanBright[0], colors.cyanBright[1], colors.cyanBright[2]);
    doc.text(`PAGE ${pageNum} OF ${totalPages}`, marginX + contentWidth - 65, bottomFooterMargin + 14);
  };

  // Tracking cursor
  let cursorY = topHeaderMargin + 12;

  // Page break check helper
  const ensureSpace = (neededHeight: number) => {
    if (cursorY + neededHeight > bottomFooterMargin - 15) {
      doc.addPage();
      cursorY = topHeaderMargin + 15;
    }
  };

  // Draw 4 Executive KPI Callout Cards on First Page
  const drawExecutiveKpiBanner = () => {
    ensureSpace(45);
    const kpis: KpiMetric[] = [
      { label: 'TURNAROUND SLA', value: '16.2 MIN (-19%)', color: colors.emerald },
      { label: 'READINESS RATING', value: '94.8% OPTIMAL', color: colors.cyanBright },
      { label: 'DELIVERED RETARDANT', value: '428,500 GAL', color: colors.skyAccent },
      { label: 'COMMITTED SORTIES', value: '142 TACTICAL', color: colors.amber },
    ];

    const cardGap = 8;
    const cardWidth = (contentWidth - cardGap * (kpis.length - 1)) / kpis.length;
    const cardHeight = 36;

    kpis.forEach((kpi, idx) => {
      const cardX = marginX + idx * (cardWidth + cardGap);
      
      // Card Background
      doc.setFillColor(colors.cardBg[0], colors.cardBg[1], colors.cardBg[2]);
      doc.rect(cardX, cursorY, cardWidth, cardHeight, 'F');

      // Border with left accent line
      doc.setDrawColor(colors.cardBorder[0], colors.cardBorder[1], colors.cardBorder[2]);
      doc.setLineWidth(0.6);
      doc.rect(cardX, cursorY, cardWidth, cardHeight, 'S');

      doc.setDrawColor(kpi.color[0], kpi.color[1], kpi.color[2]);
      doc.setLineWidth(2);
      doc.line(cardX, cursorY, cardX, cursorY + cardHeight);

      // Label
      doc.setFont('courier', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
      doc.text(kpi.label, cardX + 7, cursorY + 13);

      // Value
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
      doc.text(kpi.value, cardX + 7, cursorY + 28);
    });

    cursorY += cardHeight + 16;
  };

  // Render initial page 1 KPI cards
  drawExecutiveKpiBanner();

  // Clean Markdown parsing and rendering
  const lines = markdown.split('\n');
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Empty line
    if (!line) {
      if (inList) inList = false;
      cursorY += 6;
      continue;
    }

    // 1. Level 1 Title: # Header
    if (line.startsWith('# ')) {
      const titleText = line.replace('# ', '').trim();
      ensureSpace(38);

      // Left glowing accent bar
      doc.setFillColor(colors.cyanBright[0], colors.cyanBright[1], colors.cyanBright[2]);
      doc.rect(marginX, cursorY, 4, 18, 'F');

      // Title Text
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(colors.textWhite[0], colors.textWhite[1], colors.textWhite[2]);
      doc.text(titleText, marginX + 12, cursorY + 14);

      cursorY += 26;
      continue;
    }

    // 2. Level 2 Section Header: ## Header
    if (line.startsWith('## ')) {
      const secText = line.replace('## ', '').trim();
      ensureSpace(32);

      // Background pill for section header
      doc.setFillColor(colors.cardBg[0], colors.cardBg[1], colors.cardBg[2]);
      doc.rect(marginX, cursorY, contentWidth, 20, 'F');

      // Left Cyan border
      doc.setFillColor(colors.cyanPrimary[0], colors.cyanPrimary[1], colors.cyanPrimary[2]);
      doc.rect(marginX, cursorY, 3, 20, 'F');

      // Section text
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(colors.cyanBright[0], colors.cyanBright[1], colors.cyanBright[2]);
      doc.text(secText.toUpperCase(), marginX + 10, cursorY + 14);

      // Subtle right badge
      doc.setFont('courier', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
      doc.text('[SEC // TAC-OPS]', marginX + contentWidth - 75, cursorY + 13);

      cursorY += 28;
      continue;
    }

    // 3. Level 3 Subheader: ### Header
    if (line.startsWith('### ')) {
      const subText = line.replace('### ', '').trim();
      ensureSpace(22);

      // Small diamond icon
      doc.setFillColor(colors.skyAccent[0], colors.skyAccent[1], colors.skyAccent[2]);
      doc.circle(marginX + 4, cursorY + 7, 2, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
      doc.text(subText, marginX + 12, cursorY + 10);

      cursorY += 18;
      continue;
    }

    // 4. Horizontal Divider: ---
    if (line.startsWith('---')) {
      ensureSpace(16);
      doc.setDrawColor(colors.cardBorder[0], colors.cardBorder[1], colors.cardBorder[2]);
      doc.setLineWidth(0.8);
      doc.line(marginX, cursorY + 4, marginX + contentWidth, cursorY + 4);

      // Middle diamond
      doc.setFillColor(colors.cyanBright[0], colors.cyanBright[1], colors.cyanBright[2]);
      doc.circle(marginX + contentWidth / 2, cursorY + 4, 2, 'F');

      cursorY += 14;
      continue;
    }

    // 5. Blockquote / Alert: > text
    if (line.startsWith('>')) {
      const quoteText = line.replace(/^>\s*/, '').trim();
      const wrapped = doc.splitTextToSize(quoteText, contentWidth - 24);
      const boxHeight = wrapped.length * 12 + 12;
      ensureSpace(boxHeight + 6);

      doc.setFillColor(24, 20, 15);
      doc.rect(marginX, cursorY, contentWidth, boxHeight, 'F');
      doc.setDrawColor(colors.amber[0], colors.amber[1], colors.amber[2]);
      doc.setLineWidth(1.5);
      doc.line(marginX, cursorY, marginX, cursorY + boxHeight);

      doc.setFont('courier', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(colors.amber[0], colors.amber[1], colors.amber[2]);
      wrapped.forEach((wLine: string, wIdx: number) => {
        doc.text(wLine, marginX + 12, cursorY + 12 + wIdx * 12);
      });

      cursorY += boxHeight + 8;
      continue;
    }

    // 6. Unordered Bullet Point: - or *
    if (line.startsWith('- ') || line.startsWith('* ')) {
      inList = true;
      const cleanItem = line.replace(/^[-*]\s*/, '').trim();
      
      // Strip markdown bold tags for text sizing, but we can highlight them
      const textForRender = cleanItem.replace(/\*\*(.*?)\*\*/g, '$1');
      const wrapped = doc.splitTextToSize(textForRender, contentWidth - 22);
      const itemHeight = wrapped.length * 12.5;

      ensureSpace(itemHeight + 4);

      // Cyan tactical bullet symbol ▶
      doc.setFillColor(colors.cyanBright[0], colors.cyanBright[1], colors.cyanBright[2]);
      doc.circle(marginX + 6, cursorY + 5, 2, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);

      wrapped.forEach((wLine: string, wIdx: number) => {
        doc.text(wLine, marginX + 18, cursorY + 8 + wIdx * 12.5);
      });

      cursorY += itemHeight + 5;
      continue;
    }

    // 7. Numbered Ordered List: 1. , 2. 
    if (/^\d+\.\s*/.test(line)) {
      inList = true;
      const match = line.match(/^(\d+)\.\s*(.*)$/);
      const numStr = match ? match[1].padStart(2, '0') : '01';
      const itemContent = match ? match[2] : line;
      const textForRender = itemContent.replace(/\*\*(.*?)\*\*/g, '$1');
      const wrapped = doc.splitTextToSize(textForRender, contentWidth - 26);
      const itemHeight = wrapped.length * 12.5;

      ensureSpace(itemHeight + 6);

      // Monospace number badge
      doc.setFont('courier', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(colors.cyanBright[0], colors.cyanBright[1], colors.cyanBright[2]);
      doc.text(`[${numStr}]`, marginX + 2, cursorY + 8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);

      wrapped.forEach((wLine: string, wIdx: number) => {
        doc.text(wLine, marginX + 26, cursorY + 8 + wIdx * 12.5);
      });

      cursorY += itemHeight + 6;
      continue;
    }

    // 8. Standard Paragraph Text / Metadata lines
    const textForRender = line.replace(/\*\*(.*?)\*\*/g, '$1');
    const wrapped = doc.splitTextToSize(textForRender, contentWidth);
    const paraHeight = wrapped.length * 13;

    ensureSpace(paraHeight + 6);

    // If metadata line like "Author: ...", style in courier
    if (line.includes('**Author:**') || line.includes('**Generated:**') || line.includes('**Scope:**')) {
      doc.setFont('courier', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(colors.cyanBright[0], colors.cyanBright[1], colors.cyanBright[2]);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
    }

    wrapped.forEach((wLine: string, wIdx: number) => {
      doc.text(wLine, marginX, cursorY + 8 + wIdx * 13);
    });

    cursorY += paraHeight + 6;
  }

  // Final Pass: Apply background, header & footer frames to ALL generated pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    decorateTacticalPage(p, totalPages);
  }

  // Save PDF file
  const fileName = `AxiomBI_Tactical_Briefing_v${options.reportVersion}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
};
