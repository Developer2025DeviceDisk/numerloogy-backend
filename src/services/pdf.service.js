const PDFDocument = require('pdfkit');

const generateNumerologyPDF = (userData, apiData) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ 
                margin: 50, 
                bufferPages: true,
                size: 'A4'
            });
            let chunks = [];

            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', (err) => reject(err));

            // 🎨 PROFESSIONAL COLOR PALETTE
            const colors = {
                goldBg: '#FDF8EE',     // Softer cream
                darkGold: '#8E6E27',   // Deeper, more "expensive" gold
                accentGold: '#B8963F',
                richBlack: '#1A1A1A',
                mutedGray: '#555555',
                cardWhite: '#FFFFFF'
            };

            const drawBorder = () => {
                // Outer Thick Border
                doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
                    .lineWidth(2)
                    .strokeColor(colors.accentGold)
                    .stroke();
                // Inner Thin Decorative Line
                doc.rect(25, 25, doc.page.width - 50, doc.page.height - 50)
                    .lineWidth(0.5)
                    .strokeColor(colors.accentGold)
                    .stroke();
            };

            // =========================
            // 📜 PREMIUM COVER PAGE
            // =========================
            doc.rect(0, 0, doc.page.width, doc.page.height).fill(colors.goldBg);
            drawBorder();

            doc.moveDown(6);
            doc.fillColor(colors.darkGold)
                .fontSize(40)
                .text('MAHAKAL', { align: 'center', characterSpacing: 2 });
            
            doc.fontSize(14)
                .fillColor(colors.mutedGray)
                .text('ANCIENT NUMEROLOGY INSIGHTS', { align: 'center', characterSpacing: 1 });

            // Decorative Center Element
            const centerX = doc.page.width / 2;
            doc.moveTo(centerX - 50, doc.y + 20).lineTo(centerX + 50, doc.y + 20).strokeColor(colors.accentGold).stroke();

            doc.moveDown(5);
            doc.fillColor(colors.richBlack)
                .fontSize(28)
                .text(userData.fullName.toUpperCase(), { align: 'center' });

            doc.moveDown(0.5);
            doc.fontSize(16)
                .fillColor(colors.accentGold)
                .text(`DOB: ${userData.dob}`, { align: 'center' });

            // =========================
            // 📄 INSIGHTS PAGE
            // =========================
            doc.addPage();
            doc.rect(0, 0, doc.page.width, doc.page.height).fill(colors.goldBg);
            
            doc.fillColor(colors.darkGold)
                .fontSize(22)
                .text('Personal Analysis', 50, 60);
            
            doc.moveDown(1);

            if (apiData && typeof apiData === 'object') {
                Object.entries(apiData).forEach(([key, value]) => {
                    if (!value || value.error) return;

                    const title = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    const text = value.detailed_meaning || value.description || value.text || "";

                    // Calculate height needed for text to avoid overlap
                    const textHeight = doc.heightOfString(text, { width: doc.page.width - 140 });
                    const cardHeight = textHeight + 60;

                    // 🚦 PAGE BREAK CHECK
                    if (doc.y + cardHeight > doc.page.height - 70) {
                        doc.addPage();
                        doc.rect(0, 0, doc.page.width, doc.page.height).fill(colors.goldBg);
                        drawBorder();
                    }

                    const currentY = doc.y;

                    // Draw Card Shadow/Outline
                    doc.roundedRect(50, currentY, doc.page.width - 100, cardHeight, 5)
                        .fill(colors.cardWhite)
                        .lineWidth(0.5)
                        .strokeColor('#E0E0E0')
                        .stroke();

                    // Gold Vertical Accent Line
                    doc.rect(50, currentY, 4, cardHeight).fill(colors.darkGold);

                    // Title
                    doc.fillColor(colors.darkGold)
                        .fontSize(13)
                        .text(title, 70, currentY + 15, { underline: true });

                    // Result Value (if exists)
                    if (value.name) {
                        doc.fillColor(colors.richBlack)
                            .fontSize(11)
                            .text(`Value: ${value.name}`, 70, currentY + 35, { oblique: true });
                    }

                    // Meaning Text
                    doc.fillColor(colors.mutedGray)
                        .fontSize(10)
                        .text(text, 70, currentY + (value.name ? 55 : 35), {
                            width: doc.page.width - 140,
                            align: 'justify',
                            lineGap: 2
                        });

                    doc.moveDown(2.5); // Space between cards
                });
            }

            // =========================
            // 📄 FOOTER LOGIC
            // =========================
            const range = doc.bufferedPageRange();
            for (let i = range.start; i < range.start + range.count; i++) {
                doc.switchToPage(i);
                drawBorder();
                
                doc.fontSize(8)
                    .fillColor(colors.accentGold)
                    .text(`© MAHAKAL NUMEROLOGY - CONFIDENTIAL REPORT`, 50, doc.page.height - 35, { align: 'left' });
                
                doc.text(`Page ${i + 1} of ${range.count}`, 50, doc.page.height - 35, { align: 'right' });
            }

            doc.end();

        } catch (error) {
            reject(error);
        }
    });
};

module.exports = { generateNumerologyPDF };