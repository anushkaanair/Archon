/**
 * ReportGenerator.tsx
 * Exports: generatePDF(blueprint) — renders ReportTemplate off-screen,
 * captures with html2canvas, assembles jsPDF A4 PDF, triggers download.
 */
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import ReportTemplate, { type BlueprintData } from './ReportTemplate';

export type { BlueprintData } from './ReportTemplate';

/**
 * Inject Google Fonts into document.head (idempotent — checks before adding).
 * html2canvas captures computed styles, so fonts must be in document.fonts.
 */
function ensureFontsLoaded(): Promise<void> {
  const FONT_ID = 'archon-report-fonts';
  if (!document.getElementById(FONT_ID)) {
    const link = document.createElement('link');
    link.id   = FONT_ID;
    link.rel  = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800;12..96,900&family=JetBrains+Mono:wght@400;600;700&display=swap';
    document.head.appendChild(link);
  }
  // document.fonts.ready resolves with FontFaceSet; we only care about the
  // signal, so coerce to void to keep the signature stable across browsers.
  return document.fonts.ready.then(() => undefined);
}

/**
 * Generate and download a 3-page A4 PDF from a blueprint.
 * @param blueprint  The blueprint data object from the API or mock.
 * @param onProgress Optional callback receiving a message per stage for UI feedback.
 */
export async function generatePDF(
  blueprint: BlueprintData,
  onProgress?: (msg: string) => void,
): Promise<void> {
  onProgress?.('Loading fonts…');

  // 1. Ensure Google Fonts are loaded in document.fonts
  await ensureFontsLoaded();

  onProgress?.('Rendering report…');

  // 2. Create an off-screen container and render the template synchronously
  const container = document.createElement('div');
  container.style.cssText = [
    'position:fixed',
    'left:-9999px',
    'top:0',
    'width:794px',
    'overflow:visible',
    'z-index:-9999',
    'pointer-events:none',
  ].join(';');
  document.body.appendChild(container);

  const root = createRoot(container);
  // flushSync forces React to complete the render synchronously
  // so the DOM is fully populated before html2canvas runs.
  flushSync(() => {
    root.render(createElement(ReportTemplate, { blueprint }));
  });

  // 3. Small delay so any CSS transitions settle (not strictly required but safe)
  await new Promise(r => setTimeout(r, 50));

  // 4. Capture each page
  const { default: html2canvas } = await import('html2canvas');
  const { jsPDF } = await import('jspdf');

  const pageEls = Array.from(container.querySelectorAll<HTMLElement>('[data-report-page="true"]'));
  if (pageEls.length === 0) {
    root.unmount();
    document.body.removeChild(container);
    throw new Error('ReportTemplate rendered 0 pages — check that data-report-page="true" is set on each page div.');
  }

  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const pdfW = pdf.internal.pageSize.getWidth();   // 210mm
  const pdfH = pdf.internal.pageSize.getHeight();  // 297mm

  for (let i = 0; i < pageEls.length; i++) {
    onProgress?.(`Capturing page ${i + 1} of ${pageEls.length}…`);
    const canvas = await html2canvas(pageEls[i], {
      scale: 2,           // 2× for retina quality
      useCORS: true,      // allow cross-origin images (e.g. Archon logo)
      logging: false,
      backgroundColor: '#ffffff',
    });
    const imgData = canvas.toDataURL('image/png');
    if (i > 0) pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
  }

  // 5. Download
  onProgress?.('Saving PDF…');
  const bpId = blueprint.id ?? Date.now().toString();
  pdf.save(`archon-blueprint-${bpId}.pdf`);

  // 6. Clean up
  root.unmount();
  document.body.removeChild(container);
}
