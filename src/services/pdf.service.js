const PDFDocument = require('pdfkit');

/**
 * Generates a Premium Vedic Numerology PDF
 * @param {Object} userData - Contains name and dob
 * @param {Object} apiData - Contains numerology calculations and the 3x3 grid array
 */
const generateNumerologyPDF = (userData, apiData) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ 
                margin: 40, 
                bufferPages: true,
                size: 'A4'
            });
            let chunks = [];

            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', (err) => reject(err));

            const colors = {
                goldBg: '#FDF8EE', // Light cream/parchment
                darkGold: '#8E6E27',
                accentGold: '#B8963F',
                richBlack: '#1A1A1A',
                mutedGray: '#555555',
                cardWhite: '#FFFFFF'
            };

            // Shared UI Decoration Function
            const applyDecorations = () => {
                const { width, height } = doc.page;
                doc.save();
                // Double Border
                doc.rect(20, 20, width - 40, height - 40).lineWidth(2).strokeColor(colors.darkGold).stroke();
                doc.rect(25, 25, width - 50, height - 50).lineWidth(0.5).strokeColor(colors.accentGold).stroke();
                
                // Corner Accents (Decorative dots)
                const corners = [[30, 30], [width-30, 30], [30, height-30], [width-30, height-30]];
                corners.forEach(([x, y]) => {
                    doc.circle(x, y, 2).fill(colors.darkGold);
                });
                doc.restore();
            };

            // ==========================================
            // PAGE 1: COVER & LO SHU GRID
            // ==========================================
            doc.rect(0, 0, doc.page.width, doc.page.height).fill(colors.goldBg);
            applyDecorations();

            doc.moveDown(3);
            doc.fillColor(colors.darkGold).fontSize(30).text('MAHAKAL', { align: 'center', characterSpacing: 8 });
            doc.fontSize(10).fillColor(colors.mutedGray).text('ANCIENT VEDIC NUMEROLOGY REPORT', { align: 'center' });

            doc.moveDown(4);
            doc.fillColor(colors.richBlack).fontSize(24).text(userData.fullName?.toUpperCase() || "SURAJ SINGH", { align: 'center' });
            doc.fontSize(12).fillColor(colors.darkGold).text(`BORN ON: ${userData.dob || "01-01-2000"}`, { align: 'center' });

            // Render the Lo Shu Grid (The 3x3 Square)
            doc.moveDown(3);
            const centerX = doc.page.width / 2;
            const gridSize = 50; // size of each cell
            const startX = centerX - (gridSize * 1.5);
            const startY = doc.y;

            doc.fontSize(12).text("THE SACRED ALIGNMENT", { align: 'center' });
            doc.moveDown(1);

            // Lo Shu Grid Rendering Logic
            // apiData.grid is expected to be an array of 9 numbers
            const gridValues = apiData.grid || [4, 9, 2, 3, 5, 7, 8, 1, 6]; 
            
            gridValues.forEach((num, index) => {
                const row = Math.floor(index / 3);
                const col = index % 3;
                const x = startX + (col * gridSize);
                const y = startY + 30 + (row * gridSize);

                // Draw Cell
                doc.rect(x, y, gridSize, gridSize).lineWidth(1).strokeColor(colors.accentGold).stroke();
                
                // Draw Number
                if (num) {
                    doc.fillColor(colors.richBlack)
                       .fontSize(18)
                       .text(num.toString(), x, y + 15, { width: gridSize, align: 'center' });
                }
            });

            // ==========================================
            // PAGE 2-3: CHARACTERISTICS
            // ==========================================
            doc.addPage();
            doc.rect(0, 0, doc.page.width, doc.page.height).fill(colors.goldBg);
            applyDecorations();

            doc.fillColor(colors.darkGold).fontSize(18).text("I. CORE CHARACTERISTICS", 50, 60);
            doc.moveDown(2);

            const analysisEntries = Object.entries(apiData).filter(([k, v]) => v && typeof v === 'object' && v.name);

            analysisEntries.forEach(([key, value]) => {
                const title = key.replace(/_/g, ' ').toUpperCase();
                const description = value.detailed_meaning || value.description || "Information not available.";

                // Smart Page Break
                if (doc.y > 700) {
                    doc.addPage();
                    doc.rect(0, 0, doc.page.width, doc.page.height).fill(colors.goldBg);
                    applyDecorations();
                    doc.y = 70;
                }

                doc.fillColor(colors.darkGold).fontSize(11).text(`${title}: ${value.name}`, { bold: true });
                doc.moveDown(0.5);
                doc.fillColor(colors.mutedGray).fontSize(10).text(description, { align: 'justify', lineGap: 2 });
                doc.moveDown(2);
            });

            // ==========================================
            // PAGE 4: REMEDIES & FOOTER
            // ==========================================
            doc.addPage();
            doc.rect(0, 0, doc.page.width, doc.page.height).fill(colors.goldBg);
            applyDecorations();

            doc.y = 70;
            doc.fillColor(colors.darkGold).fontSize(18).text("II. SACRED REMEDIES", 50, doc.y);
            doc.moveDown(2);

            const remedies = [
                { t: "LUCKY COLORS", d: "Shades of gold, cream, and deep yellow to enhance your aura." },
                { t: "FAVORABLE DAYS", d: "Sundays and Thursdays are your power windows for new beginnings." },
                { t: "GEMSTONE VIBRATION", d: "Consider Yellow Sapphire or Citrine to align with your core frequency." }
            ];

            remedies.forEach(r => {
                doc.fillColor(colors.richBlack).fontSize(11).text(r.t, { underline: true });
                doc.fillColor(colors.mutedGray).fontSize(10).text(r.d);
                doc.moveDown(1.5);
            });

            // Final Footer Signature
            doc.moveDown(4);
            const footerY = doc.y;
            doc.rect(50, footerY, doc.page.width - 100, 40).fill(colors.darkGold);
            doc.fillColor(colors.cardWhite).fontSize(10).text("MAY THE NUMBERS GUIDE YOUR PATH", 50, footerY + 15, { align: 'center' });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = { generateNumerologyPDF };