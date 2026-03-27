const PDFDocument = require('pdfkit');

const generateNumerologyPDF = (userData, apiData) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, bufferPages: true });
            let chunks = [];

            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', (err) => reject(err));

            // 🎨 COLORS
            const goldBg = '#F5E6C8';
            const darkGold = '#B8963F';
            const black = '#000000';
            const gray = '#444444';
            const cardBg = '#FFF8E7';

            // 🪄 FUNCTION: PAGE BORDER
            const drawBorder = () => {
                doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
                    .strokeColor(darkGold)
                    .lineWidth(1)
                    .stroke();
            };

            // =========================
            // 📜 COVER PAGE
            // =========================
            doc.rect(0, 0, doc.page.width, doc.page.height).fill(goldBg);
            drawBorder();

            doc.moveDown(5);

            doc.fillColor(darkGold)
                .fontSize(32)
                .text('MAHAKAL', { align: 'center' });

            doc.moveDown(1);

            doc.fontSize(18)
                .fillColor(gray)
                .text('Numerology Report', { align: 'center' });

            doc.moveDown(3);

            // 👤 BIG NAME
            doc.fillColor(black)
                .fontSize(24)
                .text(userData.fullName.toUpperCase(), { align: 'center' });

            doc.moveDown(1);

            doc.fontSize(14)
                .fillColor(gray)
                .text(`Date of Birth: ${userData.dob}`, { align: 'center' });

            doc.moveDown(6);

            doc.fontSize(10)
                .fillColor(gray)
                .text('Confidential & Personalized Report', { align: 'center' });

            // ➕ ADD NEW PAGE
            doc.addPage();

            // =========================
            // 📄 MAIN PAGE START
            // =========================
            doc.rect(0, 0, doc.page.width, doc.page.height).fill(goldBg);
            drawBorder();

            doc.fillColor(darkGold)
                .fontSize(20)
                .text('Numerology Insights', { align: 'center' });

            doc.moveDown(2);

            // =========================
            // 🔮 INSIGHTS WITH CARDS
            // =========================
            if (apiData && typeof apiData === 'object') {
                Object.entries(apiData).forEach(([key, value], index) => {
                    if (!value || value.error) return;

                    const title = key.replace(/_/g, ' ')
                        .replace(/\b\w/g, l => l.toUpperCase());

                    // 🌓 ALTERNATING CARD BG
                    const isAlt = index % 2 === 0;
                    const bgColor = isAlt ? cardBg : '#FFFFFF';

                    const startY = doc.y;

                    // Card Box
                    doc.roundedRect(50, startY, doc.page.width - 100, 100, 8)
                        .fill(bgColor);

                    doc.fillColor(darkGold)
                        .fontSize(13)
                        .text(title, 60, startY + 10);

                    let contentY = startY + 30;

                    doc.fillColor(black)
                        .fontSize(10);

                    if (value.name) {
                        doc.text(`Result: ${value.name}`, 60, contentY);
                        contentY += 15;
                    }

                    const text =
                        value.detailed_meaning ||
                        value.description ||
                        value.text;

                    if (text) {
                        doc.fillColor(gray)
                            .text(text, 60, contentY, {
                                width: doc.page.width - 120
                            });
                    }

                    doc.moveDown(6);
                });
            }

            // =========================
            // 📄 FOOTER + PAGE NUMBERS
            // =========================
            const range = doc.bufferedPageRange();

            for (let i = range.start; i < range.start + range.count; i++) {
                doc.switchToPage(i);

                drawBorder();

                doc.fillColor(gray)
                    .fontSize(9)
                    .text(
                        `Mahakal Report • Page ${i + 1}`,
                        50,
                        doc.page.height - 40,
                        {
                            align: 'center',
                            width: doc.page.width - 100
                        }
                    );
            }

            doc.end();

        } catch (error) {
            reject(error);
        }
    });
};

module.exports = { generateNumerologyPDF };