import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Packer, Document, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel } from 'docx';
import saveAs from 'file-saver';
import { QuoteData } from '../types';

const formatCurrency = (value: number) => `R$ ${value.toFixed(2)}`;

// Helper to add header and footer to PDF
const addPdfHeaderFooter = (doc: jsPDF, data: QuoteData) => {
    // Header
    doc.setFontSize(20);
    doc.setTextColor('#00447d');
    doc.text(data.companyInfo.name, 15, 20);
    doc.setFontSize(10);
    doc.setTextColor('#606062');
    doc.text(data.companyInfo.address, 15, 26);
    doc.text(`${data.companyInfo.phone} | ${data.companyInfo.email} | ${data.companyInfo.website}`, 15, 32);
    doc.setDrawColor('#00447d');
    doc.line(15, 35, 195, 35);
};


export const exportToPdf = (quoteData: QuoteData, generatedText: string) => {
    const doc = new jsPDF();
    const monthlySubtotal = quoteData.monthlyItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
    const monthlyTotal = monthlySubtotal * (1 - (quoteData.discount / 100));
    const oneTimeTotal = quoteData.oneTimeItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);

    addPdfHeaderFooter(doc, quoteData);

    doc.setFontSize(18);
    doc.setTextColor('#00447d');
    doc.text('Proposta Comercial', 15, 45);

    doc.setFontSize(11);
    doc.setTextColor('#000000');
    doc.text(`Cliente: ${quoteData.clientInfo.name}`, 15, 55);
    doc.text(`Cidade: ${quoteData.clientInfo.city}`, 15, 60);
    doc.text(`Contato: ${quoteData.clientInfo.email} | ${quoteData.clientInfo.phone}`, 15, 65);
    
    doc.text(`Proposta N°: ${quoteData.quoteNumber}`, 140, 55);
    doc.text(`Data: ${quoteData.date}`, 140, 60);
    doc.text(`Validade: ${quoteData.validity}`, 140, 65);
    doc.text(`Consultor: ${quoteData.consultantName}`, 140, 70);

    let finalY = 80;

    // AI Generated Text Body
    doc.setFontSize(12);
    const splitText = doc.splitTextToSize(generatedText, 180);
    doc.text(splitText, 15, finalY);
    finalY = doc.getTextDimensions(splitText).h + finalY + 10;

    // Monthly Items Table
    if (quoteData.monthlyItems.length > 0) {
        (doc as any).autoTable({
            startY: finalY,
            head: [['Itens da Mensalidade (Recorrente)']],
            body: quoteData.monthlyItems.map(item => [
                { content: `${item.description}\n${formatCurrency(item.unitPrice)}`, styles: { fontStyle: 'normal' } }
            ]),
            theme: 'striped',
            headStyles: { fillColor: '#00447d' },
        });
        finalY = (doc as any).lastAutoTable.finalY + 5;
        doc.setFontSize(10);
        doc.text(`Subtotal Mensal: ${formatCurrency(monthlySubtotal)}`, 15, finalY);
        doc.text(`Desconto: ${quoteData.discount}%`, 15, finalY + 5);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(`Total Mensal: ${formatCurrency(monthlyTotal)}`, 15, finalY + 12);
        doc.setFont(undefined, 'normal');
        finalY += 20;
    }

    // One-Time Items Table
    if (quoteData.oneTimeItems.length > 0) {
        (doc as any).autoTable({
            startY: finalY,
            head: [['Serviços (Pagamento Único)']],
            body: quoteData.oneTimeItems.map(item => [
                { content: `${item.description}\n${formatCurrency(item.unitPrice)}`, styles: { fontStyle: 'normal' } }
            ]),
            theme: 'striped',
            headStyles: { fillColor: '#606062' },
        });
        finalY = (doc as any).lastAutoTable.finalY + 5;
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(`Total Serviços: ${formatCurrency(oneTimeTotal)}`, 15, finalY + 5);
        finalY += 15;
    }

    doc.save(`Proposta_${quoteData.clientInfo.name.replace(/\s/g, '_')}_${quoteData.quoteNumber}.pdf`);
};

export const exportToWord = (quoteData: QuoteData, generatedText: string) => {
    const monthlySubtotal = quoteData.monthlyItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
    const monthlyTotal = monthlySubtotal * (1 - (quoteData.discount / 100));
    const oneTimeTotal = quoteData.oneTimeItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);

    const createTable = (title: string, items: {description: string, unitPrice: number}[]) => {
        const rows = items.map(item => new TableRow({
            children: [
                new TableCell({ children: [new Paragraph(item.description)] }),
                new TableCell({ children: [new Paragraph({ text: formatCurrency(item.unitPrice), alignment: AlignmentType.END })] }),
            ],
        }));

        return new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            children: [new Paragraph({ text: title, style: "strong" })],
                            columnSpan: 2,
                        }),
                    ],
                }),
                ...rows,
            ],
        });
    };

    const doc = new Document({
        styles: {
            paragraph: {
                run: { font: "Calibri", size: 22 } // 11pt
            },
            strong: {
                run: { bold: true }
            }
        },
        sections: [{
            children: [
                new Paragraph({ text: quoteData.companyInfo.name, heading: HeadingLevel.HEADING_1 }),
                new Paragraph(quoteData.companyInfo.address),
                new Paragraph(`${quoteData.companyInfo.phone} | ${quoteData.companyInfo.email}`),
                new Paragraph({ text: ' ' }), // spacer
                new Paragraph({ text: "Proposta Comercial", heading: HeadingLevel.HEADING_2 }),
                new Paragraph(`Cliente: ${quoteData.clientInfo.name}`),
                new Paragraph(`Cidade: ${quoteData.clientInfo.city}`),
                new Paragraph(`Proposta N°: ${quoteData.quoteNumber} | Data: ${quoteData.date}`),
                new Paragraph({ text: ' ' }), // spacer
                ...generatedText.split('\n').map(p => new Paragraph(p)),
                new Paragraph({ text: ' ' }), // spacer
                
                ...(quoteData.monthlyItems.length > 0 ? [
                    createTable('Itens da Mensalidade (Recorrente)', quoteData.monthlyItems),
                    new Paragraph(`Subtotal Mensal: ${formatCurrency(monthlySubtotal)}`),
                    new Paragraph(`Desconto: ${quoteData.discount}%`),
                    new Paragraph({ text: `Total Mensal: ${formatCurrency(monthlyTotal)}`, style: "strong" }),
                    new Paragraph({ text: ' ' }), // spacer
                ] : []),
                
                ...(quoteData.oneTimeItems.length > 0 ? [
                    createTable('Serviços (Pagamento Único)', quoteData.oneTimeItems),
                    new Paragraph({ text: `Total Serviços: ${formatCurrency(oneTimeTotal)}`, style: "strong" }),
                ] : []),
            ],
        }],
    });

    Packer.toBlob(doc).then(blob => {
        saveAs(blob, `Proposta_${quoteData.clientInfo.name.replace(/\s/g, '_')}_${quoteData.quoteNumber}.docx`);
    });
};