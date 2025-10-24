// src/utils/PdfGenerator.js
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function generatePdfFromElement(elementId, fileName = 'documento.pdf') {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Elemento con ID "${elementId}" no encontrado.`);
    return;
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#fff',
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const imgProps = pdf.getImageProperties(imgData);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

  let heightLeft = pdfHeight;
  let position = 0;

  while (heightLeft > 0) {
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
    heightLeft -= pdfHeight;
    if (heightLeft > 0) {
      pdf.addPage();
      position = -pdfHeight;
    }
  }

  pdf.save(fileName);
}