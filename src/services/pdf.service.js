const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");

/**
 * ============================================================
 * PREMIUM VEDIC NUMEROLOGY PDF
 * ============================================================
 *
 * Replacement for the previous PDF generator.
 *
 * Main fixes:
 * 1. Prevents accidental blank pages.
 * 2. Prevents text from automatically overflowing into pages.
 * 3. Splits long content safely.
 * 4. Removes hard-coded customer fallback data.
 * 5. Uses API data when available.
 * 6. Calculates Lo Shu Grid from DOB when API grid is missing.
 * 7. Adds structured report sections.
 * 8. Adds page numbers only after all pages are complete.
 *
 * Usage:
 *
 * generateNumerologyPDF(userData, apiData)
 *
 * Returns:
 * Promise<Buffer>
 */

const generateNumerologyPDF = (
    userData = {},
    apiData = {}
) => {
    return new Promise((resolve, reject) => {
        try {
            // ========================================================
            // SAFE INPUT
            // ========================================================

            const safeUserData =
                userData &&
                typeof userData === "object"
                    ? userData
                    : {};

            const safeApiData =
                apiData &&
                typeof apiData === "object"
                    ? apiData
                    : {};

            // ========================================================
            // PDF
            // ========================================================

            const doc = new PDFDocument({
                size: "A4",
                margin: 0,
                bufferPages: true,
                autoFirstPage: true,
            });

            const chunks = [];

            doc.on("data", (chunk) => {
                chunks.push(chunk);
            });

            doc.on("end", () => {
                resolve(Buffer.concat(chunks));
            });

            doc.on("error", reject);

            // ========================================================
            // COLORS
            // ========================================================

            const colors = {
                background: "#061A36",
                card: "#0C2447",
                gold: "#D4AF37",
                lightGold: "#FFD86B",
                white: "#FFFFFF",
                lightText: "#D9E2F1",
                muted: "#9FB2CC",
                divider: "#345B88",
                danger: "#D97A7A",
            };

            // ========================================================
            // PAGE
            // ========================================================

            const PAGE = {
                width: doc.page.width,
                height: doc.page.height,

                left: 55,
                right: 55,

                headerY: 55,
                contentTop: 115,

                footerHeight: 55,

                contentBottom:
                    doc.page.height - 75,
            };

            const CONTENT_WIDTH =
                PAGE.width -
                PAGE.left -
                PAGE.right;

            // ========================================================
            // BACKGROUND
            // ========================================================

            const backgroundPath = path.resolve(
                __dirname,
                "../assets/report-bg.png"
            );

            // ========================================================
            // FONT HELPERS
            // ========================================================

            const setHeading = (size = 18) => {
                doc
                    .font("Helvetica-Bold")
                    .fontSize(size)
                    .fillColor(colors.gold);
            };

            const setBody = (size = 10.5) => {
                doc
                    .font("Helvetica")
                    .fontSize(size)
                    .fillColor(colors.white);
            };

            const setMuted = (size = 10) => {
                doc
                    .font("Helvetica")
                    .fontSize(size)
                    .fillColor(colors.lightText);
            };

            const setSmallMuted = () => {
                doc
                    .font("Helvetica")
                    .fontSize(9)
                    .fillColor(colors.muted);
            };

            // ========================================================
            // VALUE HELPERS
            // ========================================================

            const isEmpty = (value) => {
                return (
                    value === undefined ||
                    value === null ||
                    value === ""
                );
            };

            const scalarToString = (value) => {
                if (isEmpty(value)) {
                    return "";
                }

                if (
                    typeof value === "string" ||
                    typeof value === "number" ||
                    typeof value === "boolean"
                ) {
                    return String(value);
                }

                return "";
            };

            const cleanKey = (key) => {
                return String(key)
                    .replace(
                        /([a-z])([A-Z])/g,
                        "$1 $2"
                    )
                    .replace(
                        /[_-]+/g,
                        " "
                    )
                    .replace(
                        /\s+/g,
                        " "
                    )
                    .trim()
                    .replace(/\b\w/g, (c) =>
                        c.toUpperCase()
                    );
            };

            const getNestedValue = (
                object,
                paths = []
            ) => {
                for (const pathString of paths) {
                    const parts =
                        pathString.split(".");

                    let current = object;

                    for (const part of parts) {
                        if (
                            current &&
                            typeof current === "object" &&
                            part in current
                        ) {
                            current =
                                current[part];
                        } else {
                            current =
                                undefined;
                            break;
                        }
                    }

                    if (!isEmpty(current)) {
                        return current;
                    }
                }

                return undefined;
            };

            // ========================================================
            // DESCRIPTION EXTRACTION
            // ========================================================

            const getDescription = (value) => {
                if (
                    !value ||
                    typeof value !== "object" ||
                    Array.isArray(value)
                ) {
                    return "";
                }

                const possibleKeys = [
                    "detailed_meaning",
                    "detailedMeaning",
                    "description",
                    "meaning",
                    "interpretation",
                    "details",
                    "analysis",
                    "explanation",
                    "reading",
                    "guidance",
                    "message",
                ];

                for (const key of possibleKeys) {
                    const result =
                        scalarToString(
                            value[key]
                        );

                    if (result) {
                        return result;
                    }
                }

                return "";
            };

            // ========================================================
            // DISPLAY VALUE
            // ========================================================

            const getDisplayValue = (value) => {
                if (isEmpty(value)) {
                    return "";
                }

                if (
                    typeof value !== "object"
                ) {
                    return String(value);
                }

                if (Array.isArray(value)) {
                    return value
                        .map((item) => {
                            if (
                                item &&
                                typeof item ===
                                    "object"
                            ) {
                                return (
                                    scalarToString(
                                        item.name
                                    ) ||
                                    scalarToString(
                                        item.number
                                    ) ||
                                    scalarToString(
                                        item.value
                                    ) ||
                                    ""
                                );
                            }

                            return scalarToString(
                                item
                            );
                        })
                        .filter(Boolean)
                        .join(", ");
                }

                const possibleKeys = [
                    "number",
                    "value",
                    "result",
                    "total",
                    "name",
                    "title",
                ];

                for (const key of possibleKeys) {
                    const result =
                        scalarToString(
                            value[key]
                        );

                    if (result) {
                        return result;
                    }
                }

                return "";
            };

            // ========================================================
            // OBJECT TO LINES
            // ========================================================

            const objectToLines = (
                object,
                depth = 0
            ) => {
                if (
                    !object ||
                    typeof object !== "object"
                ) {
                    return [];
                }

                const lines = [];

                Object.entries(object).forEach(
                    ([key, value]) => {
                        if (isEmpty(value)) {
                            return;
                        }

                        const label =
                            cleanKey(key);

                        if (
                            Array.isArray(value)
                        ) {
                            const arrayText =
                                value
                                    .map(
                                        (item) => {
                                            if (
                                                item &&
                                                typeof item ===
                                                    "object"
                                            ) {
                                                return Object.entries(
                                                    item
                                                )
                                                    .map(
                                                        ([k, v]) =>
                                                            `${cleanKey(
                                                                k
                                                            )}: ${
                                                                scalarToString(
                                                                    v
                                                                ) ||
                                                                JSON.stringify(
                                                                    v
                                                                )
                                                            }`
                                                    )
                                                    .join(
                                                        " | "
                                                    );
                                            }

                                            return scalarToString(
                                                item
                                            );
                                        }
                                    )
                                    .filter(
                                        Boolean
                                    )
                                    .join(
                                        ", "
                                    );

                            if (arrayText) {
                                lines.push(
                                    `${label}: ${arrayText}`
                                );
                            }

                            return;
                        }

                        if (
                            typeof value ===
                                "object"
                        ) {
                            lines.push(
                                `${label}:`
                            );

                            const nested =
                                objectToLines(
                                    value,
                                    depth + 1
                                );

                            nested.forEach(
                                (line) => {
                                    lines.push(
                                        `  ${line}`
                                    );
                                }
                            );

                            return;
                        }

                        const text =
                            scalarToString(
                                value
                            );

                        if (text) {
                            lines.push(
                                `${label}: ${text}`
                            );
                        }
                    }
                );

                return lines;
            };

            // ========================================================
            // PAGE BACKGROUND
            // ========================================================

            const drawBackground = () => {
                if (
                    fs.existsSync(
                        backgroundPath
                    )
                ) {
                    doc.image(
                        backgroundPath,
                        0,
                        0,
                        {
                            width:
                                PAGE.width,
                            height:
                                PAGE.height,
                        }
                    );
                } else {
                    doc
                        .save()
                        .rect(
                            0,
                            0,
                            PAGE.width,
                            PAGE.height
                        )
                        .fill(
                            colors.background
                        )
                        .restore();
                }
            };

            // ========================================================
            // BORDER
            // ========================================================

            const drawBorder = () => {
                doc.save();

                doc
                    .opacity(0.35)
                    .lineWidth(1.2)
                    .strokeColor(colors.gold)
                    .roundedRect(
                        22,
                        22,
                        PAGE.width - 44,
                        PAGE.height - 44,
                        10
                    )
                    .stroke();

                doc
                    .opacity(0.7)
                    .lineWidth(0.4)
                    .strokeColor(
                        colors.lightGold
                    )
                    .roundedRect(
                        30,
                        30,
                        PAGE.width - 60,
                        PAGE.height - 60,
                        8
                    )
                    .stroke();

                doc.opacity(1);

                const corners = [
                    [34, 34],
                    [
                        PAGE.width - 34,
                        34,
                    ],
                    [
                        34,
                        PAGE.height - 34,
                    ],
                    [
                        PAGE.width - 34,
                        PAGE.height - 34,
                    ],
                ];

                corners.forEach(
                    ([x, y]) => {
                        doc
                            .circle(
                                x,
                                y,
                                3
                            )
                            .fill(
                                colors.gold
                            );

                        doc
                            .circle(
                                x,
                                y,
                                6
                            )
                            .lineWidth(
                                0.4
                            )
                            .strokeColor(
                                colors.gold
                            )
                            .stroke();
                    }
                );

                doc.restore();
            };

            // ========================================================
            // PAGE HEADER
            // ========================================================

            const drawHeader = (
                title
            ) => {
                setHeading(21);

                doc.text(
                    title,
                    PAGE.left,
                    PAGE.headerY,
                    {
                        width:
                            CONTENT_WIDTH,
                    }
                );

                doc
                    .moveTo(
                        PAGE.left,
                        88
                    )
                    .lineTo(
                        PAGE.width -
                            PAGE.right,
                        88
                    )
                    .lineWidth(1)
                    .strokeColor(
                        colors.gold
                    )
                    .stroke();
            };

            // ========================================================
            // NEW PAGE
            // ========================================================

            const startPage = (
                title = null
            ) => {
                drawBackground();
                drawBorder();

                if (title) {
                    drawHeader(title);
                }

                doc.x = PAGE.left;
                doc.y =
                    title
                        ? PAGE.contentTop
                        : 0;
            };

            // ========================================================
            // ADD PAGE
            // ========================================================

            const newPage = (
                title = null
            ) => {
                doc.addPage();
                startPage(title);
            };

            // ========================================================
            // CARD
            // ========================================================

            const drawCard = (
                x,
                y,
                width,
                height
            ) => {
                doc.save();

                doc
                    .opacity(0.22)
                    .roundedRect(
                        x,
                        y,
                        width,
                        height,
                        12
                    )
                    .fill(colors.card);

                doc
                    .opacity(0.8)
                    .roundedRect(
                        x,
                        y,
                        width,
                        height,
                        12
                    )
                    .lineWidth(0.8)
                    .strokeColor(
                        colors.gold
                    )
                    .stroke();

                doc.restore();
            };

            // ========================================================
            // SAFE TEXT HEIGHT
            // ========================================================

            const getTextHeight = (
                text,
                width,
                fontSize = 10.5,
                lineGap = 3
            ) => {
                if (!text) {
                    return 0;
                }

                doc
                    .font("Helvetica")
                    .fontSize(fontSize);

                return doc.heightOfString(
                    String(text),
                    {
                        width,
                        lineGap,
                    }
                );
            };

            // ========================================================
            // SPLIT TEXT
            // ========================================================

            const splitTextToFit = (
                text,
                width,
                maxHeight,
                fontSize = 10.5,
                lineGap = 3
            ) => {
                const words =
                    String(text)
                        .split(/\s+/);

                if (!words.length) {
                    return {
                        first: "",
                        rest: "",
                    };
                }

                let first = "";
                let index = 0;

                for (
                    let i = 0;
                    i < words.length;
                    i++
                ) {
                    const candidate =
                        first
                            ? `${first} ${words[i]}`
                            : words[i];

                    const height =
                        getTextHeight(
                            candidate,
                            width,
                            fontSize,
                            lineGap
                        );

                    if (
                        height >
                        maxHeight
                    ) {
                        break;
                    }

                    first = candidate;
                    index = i + 1;
                }

                if (!first) {
                    first = words[0];
                    index = 1;
                }

                return {
                    first,
                    rest:
                        words
                            .slice(index)
                            .join(" "),
                };
            };

            // ========================================================
            // DRAW LONG TEXT SAFELY
            // ========================================================

            const drawLongText = ({
                text,
                x,
                y,
                width,
                fontSize = 10.5,
                lineGap = 3,
                color = colors.lightText,
                title = null,
            }) => {
                let remaining =
                    String(text || "");

                let currentY = y;

                while (
                    remaining.trim()
                ) {
                    const available =
                        PAGE.contentBottom -
                        currentY;

                    if (
                        available < 35
                    ) {
                        newPage(
                            title
                        );

                        currentY =
                            PAGE.contentTop;
                    }

                    const usableHeight =
                        PAGE.contentBottom -
                        currentY;

                    const split =
                        splitTextToFit(
                            remaining,
                            width,
                            usableHeight,
                            fontSize,
                            lineGap
                        );

                    doc
                        .font("Helvetica")
                        .fontSize(
                            fontSize
                        )
                        .fillColor(color)
                        .text(
                            split.first,
                            x,
                            currentY,
                            {
                                width,
                                lineGap,
                            }
                        );

                    currentY =
                        doc.y + 10;

                    remaining =
                        split.rest;

                    if (
                        remaining.trim()
                    ) {
                        newPage(title);
                        currentY =
                            PAGE.contentTop;
                    }
                }

                return currentY;
            };

            // ========================================================
            // DATE HELPERS
            // ========================================================

            const getDOBString = () => {
                return (
                    safeUserData.dob ||
                    safeUserData.dateOfBirth ||
                    safeUserData.birthDate ||
                    getNestedValue(
                        safeUserData,
                        [
                            "personal.dob",
                            "personal.dateOfBirth",
                        ]
                    ) ||
                    ""
                );
            };

            const getFullName = () => {
                return (
                    safeUserData.fullName ||
                    safeUserData.name ||
                    getNestedValue(
                        safeUserData,
                        [
                            "personal.fullName",
                            "personal.name",
                        ]
                    ) ||
                    ""
                );
            };

            const getDOBDigits = () => {
                const dob =
                    getDOBString();

                return String(dob)
                    .replace(
                        /\D/g,
                        ""
                    );
            };

            // ========================================================
            // NUMEROLOGY CALCULATIONS
            // ========================================================

            const reduceNumber = (
                number
            ) => {
                let value =
                    Number(number);

                if (
                    !Number.isFinite(
                        value
                    )
                ) {
                    return null;
                }

                while (
                    value > 9 &&
                    value !== 11 &&
                    value !== 22 &&
                    value !== 33
                ) {
                    value =
                        String(value)
                            .split("")
                            .reduce(
                                (
                                    sum,
                                    digit
                                ) =>
                                    sum +
                                    Number(
                                        digit
                                    ),
                                0
                            );
                }

                return value;
            };

            const calculateLifePath =
                () => {
                    const digits =
                        getDOBDigits();

                    if (
                        digits.length !== 8
                    ) {
                        return null;
                    }

                    const total =
                        digits
                            .split("")
                            .reduce(
                                (
                                    sum,
                                    digit
                                ) =>
                                    sum +
                                    Number(
                                        digit
                                    ),
                                0
                            );

                    return reduceNumber(
                        total
                    );
                };

            const calculateBirthNumber =
                () => {
                    const dob =
                        getDOBString();

                    const match =
                        String(dob).match(
                            /(\d{1,2})/
                        );

                    if (!match) {
                        return null;
                    }

                    return reduceNumber(
                        Number(
                            match[1]
                        )
                    );
                };

            const calculateAttitude =
                () => {
                    const digits =
                        getDOBDigits();

                    if (
                        digits.length !== 8
                    ) {
                        return null;
                    }

                    const month =
                        Number(
                            digits.slice(
                                4,
                                6
                            )
                        );

                    const day =
                        Number(
                            digits.slice(
                                6,
                                8
                            )
                        );

                    return reduceNumber(
                        month + day
                    );
                };

            // ========================================================
            // LO SHU
            // ========================================================

            const calculateLoShuGrid =
                () => {
                    const digits =
                        getDOBDigits();

                    const counts = {};

                    for (
                        let i = 1;
                        i <= 9;
                        i++
                    ) {
                        counts[i] = 0;
                    }

                    digits
                        .split("")
                        .map(Number)
                        .forEach(
                            (digit) => {
                                if (
                                    digit >=
                                        1 &&
                                    digit <= 9
                                ) {
                                    counts[
                                        digit
                                    ]++;
                                }
                            }
                        );

                    // Traditional Lo Shu positions
                    const positions = [
                        4, 9, 2,
                        3, 5, 7,
                        8, 1, 6,
                    ];

                    return positions.map(
                        (number) => {
                            if (
                                counts[
                                    number
                                ] === 0
                            ) {
                                return "";
                            }

                            return Array(
                                counts[
                                    number
                                ]
                            )
                                .fill(
                                    number
                                )
                                .join("");
                        }
                    );
                };

            const getGrid = () => {
                const apiGrid =
                    safeApiData.grid;

                if (
                    Array.isArray(
                        apiGrid
                    ) &&
                    apiGrid.length >= 9
                ) {
                    return apiGrid
                        .slice(0, 9);
                }

                if (
                    apiGrid &&
                    typeof apiGrid ===
                        "object"
                ) {
                    const values =
                        Object.values(
                            apiGrid
                        ).flat();

                    if (
                        values.length >=
                        9
                    ) {
                        return values.slice(
                            0,
                            9
                        );
                    }
                }

                return calculateLoShuGrid();
            };

            // ========================================================
            // NUMBER INTERPRETATIONS
            // ========================================================

            const numberMeanings = {
                1: {
                    title: "The Initiator",
                    text:
                        "Number 1 is associated with independence, initiative, confidence and the desire to create a distinct path. Its constructive expression encourages leadership and decisive action. Its lesson is to balance self-reliance with cooperation.",
                },

                2: {
                    title: "The Harmonizer",
                    text:
                        "Number 2 is associated with sensitivity, cooperation, diplomacy and awareness of other people. It supports partnership and emotional intelligence. Its lesson is to develop confidence without becoming overly dependent on external approval.",
                },

                3: {
                    title: "The Communicator",
                    text:
                        "Number 3 represents creativity, expression, optimism and social energy. It favors communication, learning and artistic expression. Its lesson is to turn inspiration into consistent, completed work.",
                },

                4: {
                    title: "The Builder",
                    text:
                        "Number 4 emphasizes structure, discipline, practicality and steady effort. It supports long-term construction and reliable systems. Its lesson is to remain adaptable while maintaining consistency.",
                },

                5: {
                    title: "The Explorer",
                    text:
                        "Number 5 represents freedom, movement, curiosity and adaptability. It encourages learning through experience and change. Its lesson is to use freedom responsibly and avoid unnecessary restlessness.",
                },

                6: {
                    title: "The Nurturer",
                    text:
                        "Number 6 is connected with responsibility, harmony, care, family and service. It can bring a strong sense of duty and aesthetics. Its lesson is to care for others without carrying every responsibility alone.",
                },

                7: {
                    title: "The Seeker",
                    text:
                        "Number 7 is associated with introspection, analysis, spirituality and the search for deeper understanding. It favors research, contemplation and specialized knowledge. Its lesson is to balance solitude with authentic human connection.",
                },

                8: {
                    title: "The Achiever",
                    text:
                        "Number 8 emphasizes ambition, organization, responsibility, material management and results. It can support leadership and long-term achievement. Its lesson is to combine authority with ethics and balance.",
                },

                9: {
                    title: "The Humanitarian",
                    text:
                        "Number 9 represents compassion, completion, wisdom and a broader sense of service. It encourages generosity and perspective. Its lesson is to release what has completed its purpose and avoid becoming emotionally overextended.",
                },

                11: {
                    title: "The Intuitive Visionary",
                    text:
                        "Master Number 11 is traditionally associated with heightened intuition, inspiration and sensitivity. It can amplify awareness and creative insight. Its lesson is to ground inspiration through discipline and practical action.",
                },

                22: {
                    title: "The Master Builder",
                    text:
                        "Master Number 22 is traditionally associated with large-scale vision, organization and the ability to turn ideas into tangible structures. Its lesson is to manage pressure and build patiently.",
                },

                33: {
                    title: "The Compassionate Guide",
                    text:
                        "Master Number 33 is traditionally associated with compassion, teaching and service. It can emphasize responsibility toward others. Its lesson is to maintain healthy boundaries while expressing generosity.",
                },
            };

            const getMeaning = (
                number
            ) => {
                return (
                    numberMeanings[
                        Number(number)
                    ] || {
                        title:
                            "Personal Number",
                        text:
                            "This number forms part of your personal numerology pattern. Its interpretation should be considered together with your complete birth-date and name-based analysis.",
                    }
                );
            };

            // ========================================================
            // API ENTRY HELPERS
            // ========================================================

            const findApiValue = (
                names
            ) => {
                return getNestedValue(
                    safeApiData,
                    names
                );
            };

            const getCoreNumber = (
                names,
                fallback
            ) => {
                const value =
                    findApiValue(names);

                if (
                    !isEmpty(value)
                ) {
                    if (
                        typeof value ===
                            "object"
                    ) {
                        return (
                            value.number ||
                            value.value ||
                            value.result ||
                            fallback ||
                            null
                        );
                    }

                    return value;
                }

                return fallback;
            };

            const lifePath =
                getCoreNumber(
                    [
                        "lifePath",
                        "life_path",
                        "lifePathNumber",
                        "life_path_number",
                        "core.lifePath",
                    ],
                    calculateLifePath()
                );

            const birthNumber =
                getCoreNumber(
                    [
                        "birthNumber",
                        "birth_number",
                        "psychicNumber",
                        "moolank",
                        "birth.number",
                    ],
                    calculateBirthNumber()
                );

            const attitudeNumber =
                getCoreNumber(
                    [
                        "attitude",
                        "attitudeNumber",
                        "attitude_number",
                        "core.attitude",
                    ],
                    calculateAttitude()
                );

            const expression =
                findApiValue([
                    "expression",
                    "expressionNumber",
                    "expression_number",
                    "destiny",
                    "destinyNumber",
                    "destiny_number",
                    "core.expression",
                ]);

            const soulUrge =
                findApiValue([
                    "soulUrge",
                    "soul_urge",
                    "soulUrgeNumber",
                    "soul_urge_number",
                    "heartDesire",
                    "heart_desire",
                    "core.soulUrge",
                ]);

            const personality =
                findApiValue([
                    "personality",
                    "personalityNumber",
                    "personality_number",
                    "core.personality",
                ]);

            // ========================================================
            // COVER PAGE
            // ========================================================

            startPage();

            // Brand

            setHeading(31);

            doc.text(
                "ASTROVASTUCONNECT",
                0,
                72,
                {
                    width:
                        PAGE.width,
                    align: "center",
                    characterSpacing: 1,
                }
            );

            setMuted(12);

            doc.text(
                "ANCIENT VEDIC NUMEROLOGY REPORT",
                0,
                113,
                {
                    width:
                        PAGE.width,
                    align: "center",
                    characterSpacing: 1,
                }
            );

            // Divider

            doc.save();

            doc
                .opacity(0.8)
                .moveTo(
                    105,
                    145
                )
                .lineTo(
                    250,
                    145
                )
                .strokeColor(
                    colors.gold
                )
                .lineWidth(0.8)
                .stroke();

            doc
                .circle(
                    PAGE.width / 2,
                    145,
                    5
                )
                .fill(colors.gold);

            doc
                .moveTo(
                    345,
                    145
                )
                .lineTo(
                    490,
                    145
                )
                .strokeColor(
                    colors.gold
                )
                .lineWidth(0.8)
                .stroke();

            doc.restore();

            // Title

            setHeading(25);

            doc.text(
                "Personal Numerology Report",
                0,
                178,
                {
                    width:
                        PAGE.width,
                    align: "center",
                }
            );

            setMuted(11);

            doc.text(
                "Based on Ancient Vedic Numerology Principles",
                0,
                210,
                {
                    width:
                        PAGE.width,
                    align: "center",
                }
            );

            // User information

            const userCardX = 65;
            const userCardY = 255;
            const userCardWidth =
                PAGE.width - 130;
            const userCardHeight = 150;

            drawCard(
                userCardX,
                userCardY,
                userCardWidth,
                userCardHeight
            );

            setHeading(11);

            doc.text(
                "NAME",
                userCardX + 30,
                userCardY + 27
            );

            setBody(21);

            doc.text(
                String(
                    getFullName() ||
                        "Not provided"
                ).toUpperCase(),
                userCardX + 30,
                userCardY + 48,
                {
                    width:
                        userCardWidth - 80,
                }
            );

            setHeading(11);

            doc.text(
                "DATE OF BIRTH",
                userCardX + 30,
                userCardY + 97
            );

            setBody(17);

            doc.text(
                String(
                    getDOBString() ||
                        "Not provided"
                ),
                userCardX + 30,
                userCardY + 117
            );

            // Cover section

            setHeading(18);

            doc.text(
                "THE SACRED ALIGNMENT",
                0,
                450,
                {
                    width:
                        PAGE.width,
                    align: "center",
                }
            );

            setMuted(10.5);

            doc.text(
                "Your Personal Lo Shu Energy Matrix",
                0,
                478,
                {
                    width:
                        PAGE.width,
                    align: "center",
                }
            );

            // ========================================================
            // LO SHU GRID
            // ========================================================

            const gridValues =
                getGrid();

            const cellSize = 64;
            const cellGap = 8;

            const gridWidth =
                cellSize * 3 +
                cellGap * 2;

            const gridStartX =
                (PAGE.width -
                    gridWidth) /
                2;

            const gridStartY = 505;

            gridValues.forEach(
                (value, index) => {
                    const row =
                        Math.floor(
                            index / 3
                        );

                    const col =
                        index % 3;

                    const x =
                        gridStartX +
                        col *
                            (cellSize +
                                cellGap);

                    const y =
                        gridStartY +
                        row *
                            (cellSize +
                                cellGap);

                    doc.save();

                    doc
                        .opacity(0.20)
                        .roundedRect(
                            x,
                            y,
                            cellSize,
                            cellSize,
                            10
                        )
                        .fill(colors.card);

                    doc.restore();

                    doc
                        .roundedRect(
                            x,
                            y,
                            cellSize,
                            cellSize,
                            10
                        )
                        .lineWidth(1.2)
                        .strokeColor(
                            colors.gold
                        )
                        .stroke();

                    if (
                        !isEmpty(value)
                    ) {
                        setHeading(22);

                        doc.text(
                            String(value),
                            x,
                            y + 19,
                            {
                                width:
                                    cellSize,
                                align:
                                    "center",
                            }
                        );
                    }

                    doc
                        .circle(
                            x + 8,
                            y + 8,
                            1.3
                        )
                        .fill(
                            colors.gold
                        );

                    doc
                        .circle(
                            x +
                                cellSize -
                                8,
                            y + 8,
                            1.3
                        )
                        .fill(
                            colors.gold
                        );

                    doc
                        .circle(
                            x + 8,
                            y +
                                cellSize -
                                8,
                            1.3
                        )
                        .fill(
                            colors.gold
                        );

                    doc
                        .circle(
                            x +
                                cellSize -
                                8,
                            y +
                                cellSize -
                                8,
                            1.3
                        )
                        .fill(
                            colors.gold
                        );
                }
            );

            setSmallMuted();

            doc.text(
                "Numbers appearing multiple times indicate stronger emphasis, while empty positions can represent areas requiring conscious development.",
                65,
                735,
                {
                    width:
                        PAGE.width - 130,
                    align: "center",
                }
            );

            // ========================================================
            // PAGE 2 — PERSONAL OVERVIEW
            // ========================================================

            newPage(
                "PERSONAL NUMEROLOGY OVERVIEW"
            );

            const overviewItems = [
                {
                    title: "LIFE PATH",
                    number: lifePath,
                },
                {
                    title: "BIRTH NUMBER",
                    number: birthNumber,
                },
                {
                    title: "ATTITUDE",
                    number: attitudeNumber,
                },
                {
                    title: "EXPRESSION / DESTINY",
                    number:
                        getDisplayValue(
                            expression
                        ),
                },
                {
                    title: "SOUL URGE",
                    number:
                        getDisplayValue(
                            soulUrge
                        ),
                },
                {
                    title: "PERSONALITY",
                    number:
                        getDisplayValue(
                            personality
                        ),
                },
            ];

            let overviewY =
                PAGE.contentTop;

            const overviewCardWidth =
                (CONTENT_WIDTH - 15) /
                2;

            const overviewCardHeight =
                125;

            overviewItems.forEach(
                (item, index) => {
                    if (
                        index > 0 &&
                        index % 2 === 0
                    ) {
                        overviewY +=
                            overviewCardHeight +
                            15;
                    }

                    const column =
                        index % 2;

                    const x =
                        PAGE.left +
                        column *
                            (overviewCardWidth +
                                15);

                    const y =
                        overviewY;

                    drawCard(
                        x,
                        y,
                        overviewCardWidth,
                        overviewCardHeight
                    );

                    setHeading(10);

                    doc.text(
                        item.title,
                        x + 18,
                        y + 18,
                        {
                            width:
                                overviewCardWidth -
                                36,
                        }
                    );

                    const numberText =
                        isEmpty(
                            item.number
                        )
                            ? "Not calculated"
                            : String(
                                  item.number
                              );

                    setBody(20);

                    doc.text(
                        numberText,
                        x + 18,
                        y + 40,
                        {
                            width:
                                overviewCardWidth -
                                36,
                            ellipsis: true,
                        }
                    );

                    if (
                        !isEmpty(
                            item.number
                        ) &&
                        !Number.isNaN(
                            Number(
                                item.number
                            )
                        )
                    ) {
                        const meaning =
                            getMeaning(
                                Number(
                                    item.number
                                )
                            );

                        setMuted(9.5);

                        doc.text(
                            meaning.title,
                            x + 18,
                            y + 73,
                            {
                                width:
                                    overviewCardWidth -
                                    36,
                            }
                        );
                    } else {
                        setSmallMuted();

                        doc.text(
                            "Name-based calculation requires valid name analysis data.",
                            x + 18,
                            y + 73,
                            {
                                width:
                                    overviewCardWidth -
                                    36,
                            }
                        );
                    }
                }
            );

            // ========================================================
            // CORE CHARACTERISTICS
            // ========================================================

            newPage(
                "I. CORE CHARACTERISTICS"
            );

            const coreSections = [
                {
                    title: "LIFE PATH",
                    number: lifePath,
                    data: findApiValue([
                        "lifePath",
                        "life_path",
                        "lifePathNumber",
                        "life_path_number",
                    ]),
                },

                {
                    title: "BIRTH NUMBER",
                    number: birthNumber,
                    data: findApiValue([
                        "birthNumber",
                        "birth_number",
                        "psychicNumber",
                        "moolank",
                    ]),
                },

                {
                    title: "ATTITUDE",
                    number: attitudeNumber,
                    data: findApiValue([
                        "attitude",
                        "attitudeNumber",
                        "attitude_number",
                    ]),
                },

                {
                    title: "EXPRESSION / DESTINY",
                    number:
                        getDisplayValue(
                            expression
                        ),
                    data: expression,
                },

                {
                    title: "SOUL URGE",
                    number:
                        getDisplayValue(
                            soulUrge
                        ),
                    data: soulUrge,
                },

                {
                    title: "PERSONALITY",
                    number:
                        getDisplayValue(
                            personality
                        ),
                    data: personality,
                },
            ];

            for (
                let i = 0;
                i < coreSections.length;
                i++
            ) {
                const section =
                    coreSections[i];

                let number =
                    section.number;

                if (
                    typeof number ===
                        "object" &&
                    number !== null
                ) {
                    number =
                        getDisplayValue(
                            number
                        );
                }

                let description =
                    getDescription(
                        section.data
                    );

                if (
                    !description &&
                    number &&
                    !Number.isNaN(
                        Number(number)
                    )
                ) {
                    description =
                        getMeaning(
                            Number(number)
                        ).text;
                }

                if (
                    !description
                ) {
                    description =
                        "This part of the personal numerology profile requires the corresponding calculation data. The PDF generator will not invent a result when the calculation service has not returned one.";
                }

                let title =
                    section.title;

                let cardHeight = 150;

                const descriptionHeight =
                    getTextHeight(
                        description,
                        CONTENT_WIDTH -
                            50,
                        10.5,
                        3
                    );

                cardHeight =
                    Math.max(
                        150,
                        118 +
                            Math.min(
                                descriptionHeight,
                                280
                            )
                    );

                if (
                    cardHeight >
                    500
                ) {
                    cardHeight = 500;
                }

                if (
                    doc.y +
                        cardHeight >
                    PAGE.contentBottom
                ) {
                    newPage(
                        "I. CORE CHARACTERISTICS"
                    );
                }

                const y =
                    doc.y;

                drawCard(
                    PAGE.left,
                    y,
                    CONTENT_WIDTH,
                    cardHeight
                );

                setHeading(10);

                doc.text(
                    title,
                    PAGE.left + 25,
                    y + 20,
                    {
                        width:
                            CONTENT_WIDTH -
                            50,
                    }
                );

                setBody(20);

                doc.text(
                    isEmpty(number)
                        ? "Not calculated"
                        : String(
                              number
                          ),
                    PAGE.left + 25,
                    y + 42,
                    {
                        width:
                            CONTENT_WIDTH -
                            50,
                        ellipsis: true,
                    }
                );

                doc
                    .moveTo(
                        PAGE.left + 25,
                        y + 80
                    )
                    .lineTo(
                        PAGE.width -
                            PAGE.right -
                            25,
                        y + 80
                    )
                    .strokeColor(
                        colors.divider
                    )
                    .lineWidth(0.7)
                    .stroke();

                setMuted(10.5);

                const maxTextHeight =
                    cardHeight - 112;

                doc.text(
                    description,
                    PAGE.left + 25,
                    y + 95,
                    {
                        width:
                            CONTENT_WIDTH -
                            50,
                        height:
                            maxTextHeight,
                        lineGap: 3,
                    }
                );

                doc.y =
                    y +
                    cardHeight +
                    15;
            }

            // ========================================================
            // LO SHU ANALYSIS
            // ========================================================

            newPage(
                "II. LO SHU ENERGY ANALYSIS"
            );

            const digits =
                getDOBDigits();

            const counts = {};

            for (
                let i = 1;
                i <= 9;
                i++
            ) {
                counts[i] = 0;
            }

            digits
                .split("")
                .map(Number)
                .forEach(
                    (digit) => {
                        if (
                            digit >= 1 &&
                            digit <= 9
                        ) {
                            counts[
                                digit
                            ]++;
                        }
                    }
                );

            const presentNumbers =
                Object.keys(counts)
                    .filter(
                        (n) =>
                            counts[n] > 0
                    )
                    .map(Number);

            const missingNumbers =
                Object.keys(counts)
                    .filter(
                        (n) =>
                            counts[n] === 0
                    )
                    .map(Number);

            // Summary card

            const summaryHeight =
                155;

            drawCard(
                PAGE.left,
                doc.y,
                CONTENT_WIDTH,
                summaryHeight
            );

            setHeading(12);

            doc.text(
                "YOUR NUMBER PATTERN",
                PAGE.left + 25,
                doc.y + 22
            );

            setMuted(10.5);

            doc.text(
                `Present numbers: ${
                    presentNumbers.length
                        ? presentNumbers.join(
                              ", "
                          )
                        : "None"
                }`,
                PAGE.left + 25,
                doc.y + 50,
                {
                    width:
                        CONTENT_WIDTH -
                        50,
                }
            );

            doc.text(
                `Missing numbers: ${
                    missingNumbers.length
                        ? missingNumbers.join(
                              ", "
                          )
                        : "None"
                }`,
                PAGE.left + 25,
                doc.y + 75,
                {
                    width:
                        CONTENT_WIDTH -
                        50,
                }
            );

            doc.text(
                `Numbers with repeated presence: ${
                    presentNumbers
                        .filter(
                            (n) =>
                                counts[
                                    n
                                ] > 1
                        )
                        .map(
                            (n) =>
                                `${n} (${counts[n]}x)`
                        )
                        .join(", ") ||
                    "None"
                }`,
                PAGE.left + 25,
                doc.y + 100,
                {
                    width:
                        CONTENT_WIDTH -
                        50,
                }
            );

            doc.y +=
                summaryHeight +
                20;

            // Number cards

            for (
                const number of [
                    1, 2, 3, 4, 5,
                    6, 7, 8, 9,
                ]
            ) {
                const meaning =
                    getMeaning(
                        number
                    );

                const present =
                    counts[number] >
                    0;

                const repeated =
                    counts[number] >
                    1;

                const text =
                    present
                        ? `${meaning.text} Your birth-date pattern contains this number ${
                              counts[
                                  number
                              ]
                          } time${
                              counts[
                                  number
                              ] > 1
                                  ? "s"
                                  : ""
                          }, giving it ${
                              repeated
                                  ? "stronger"
                                  : "noticeable"
                          } emphasis.`
                        : `Number ${number} is absent from the birth-date grid. Traditionally, an absent number is viewed as an area where conscious development, awareness and balanced habits may be useful. ${meaning.text}`;

                const h =
                    Math.min(
                        235,
                        Math.max(
                            145,
                            115 +
                                getTextHeight(
                                    text,
                                    CONTENT_WIDTH -
                                        50,
                                    9.8,
                                    3
                                )
                        )
                    );

                if (
                    doc.y + h >
                    PAGE.contentBottom
                ) {
                    newPage(
                        "II. LO SHU ENERGY ANALYSIS"
                    );
                }

                const y =
                    doc.y;

                drawCard(
                    PAGE.left,
                    y,
                    CONTENT_WIDTH,
                    h
                );

                setHeading(11);

                doc.text(
                    `${number} — ${meaning.title}`,
                    PAGE.left + 25,
                    y + 20
                );

                setSmallMuted();

                doc.text(
                    present
                        ? `Present ${
                              counts[number]
                          } time${
                              counts[
                                  number
                              ] > 1
                                  ? "s"
                                  : ""
                          }`
                        : "Not present in birth-date grid",
                    PAGE.left + 25,
                    y + 42
                );

                setMuted(9.8);

                doc.text(
                    text,
                    PAGE.left + 25,
                    y + 65,
                    {
                        width:
                            CONTENT_WIDTH -
                            50,
                        height:
                            h - 85,
                        lineGap: 3,
                    }
                );

                doc.y =
                    y +
                    h +
                    15;
            }

            // ========================================================
            // STRENGTHS & TALENTS
            // ========================================================

            newPage(
                "III. STRENGTHS & HIDDEN TALENTS"
            );

            const strengths = [];

            if (
                lifePath &&
                numberMeanings[
                    Number(lifePath)
                ]
            ) {
                strengths.push(
                    `Your Life Path ${
                        lifePath
                    } emphasizes ${
                        getMeaning(
                            Number(
                                lifePath
                            )
                        ).title.toLowerCase()
                    }. This can become a major strength when developed through consistent learning and self-awareness.`
                );
            }

            if (
                birthNumber
            ) {
                strengths.push(
                    `Your Birth Number ${
                        birthNumber
                    } adds another layer to your natural style. It should be considered together with your Life Path rather than interpreted in isolation.`
                );
            }

            if (
                attitudeNumber
            ) {
                strengths.push(
                    `Your Attitude Number ${
                        attitudeNumber
                    } influences how your energy may be perceived in everyday situations and can shape your initial approach to people and opportunities.`
                );
            }

            strengths.push(
                "Your strongest abilities become more useful when intuition, learning and practical execution are developed together."
            );

            strengths.push(
                "A premium numerology reading should be treated as a pattern of tendencies rather than a fixed prediction. Your choices, habits and environment still influence outcomes."
            );

            let strengthsY =
                PAGE.contentTop;

            strengths.forEach(
                (text, index) => {
                    const h =
                        Math.max(
                            105,
                            75 +
                                getTextHeight(
                                    text,
                                    CONTENT_WIDTH -
                                        50,
                                    10,
                                    3
                                )
                        );

                    if (
                        strengthsY + h >
                        PAGE.contentBottom
                    ) {
                        newPage(
                            "III. STRENGTHS & HIDDEN TALENTS"
                        );

                        strengthsY =
                            PAGE.contentTop;
                    }

                    drawCard(
                        PAGE.left,
                        strengthsY,
                        CONTENT_WIDTH,
                        h
                    );

                    setHeading(11);

                    doc.text(
                        `STRENGTH ${
                            index + 1
                        }`,
                        PAGE.left + 25,
                        strengthsY + 18
                    );

                    setMuted(10);

                    doc.text(
                        text,
                        PAGE.left + 25,
                        strengthsY + 45,
                        {
                            width:
                                CONTENT_WIDTH -
                                50,
                            height:
                                h - 60,
                            lineGap: 3,
                        }
                    );

                    strengthsY +=
                        h + 15;
                }
            );

            // ========================================================
            // CAREER & FINANCE
            // ========================================================

            newPage(
                "IV. CAREER & FINANCIAL DIRECTION"
            );

            const careerNumber =
                lifePath ||
                birthNumber;

            const careerMeaning =
                careerNumber
                    ? getMeaning(
                          Number(
                              careerNumber
                          )
                      )
                    : null;

            const careerText =
                careerMeaning
                    ? `Your primary number ${
                          careerNumber
                      } is traditionally associated with ${
                          careerMeaning.title.toLowerCase()
                      }. In career settings, this pattern can favor environments where these qualities are useful. The strongest results generally come when your natural tendencies are supported by discipline, practical skill development and consistent execution.`
                    : "Career interpretation requires a valid numerology number from the calculation layer.";

            const careerCards = [
                {
                    title:
                        "WORKING STYLE",
                    text:
                        careerText,
                },

                {
                    title:
                        "CAREER DEVELOPMENT",
                    text:
                        "Focus on building expertise rather than trying to master everything at once. Choose skills that can compound over time and create measurable value.",
                },

                {
                    title:
                        "FINANCIAL DISCIPLINE",
                    text:
                        "Numerology should not be used as a guarantee of financial outcomes. A practical approach is to combine your natural strengths with budgeting, long-term planning and responsible decision-making.",
                },

                {
                    title:
                        "DECISION MAKING",
                    text:
                        "When facing major professional choices, compare intuitive impressions with evidence, timelines, risks and practical consequences. This creates a healthier balance between insight and execution.",
                },
            ];

            careerCards.forEach(
                (item) => {
                    const h =
                        Math.max(
                            130,
                            90 +
                                getTextHeight(
                                    item.text,
                                    CONTENT_WIDTH -
                                        50,
                                    10,
                                    3
                                )
                        );

                    if (
                        doc.y + h >
                        PAGE.contentBottom
                    ) {
                        newPage(
                            "IV. CAREER & FINANCIAL DIRECTION"
                        );
                    }

                    const y =
                        doc.y;

                    drawCard(
                        PAGE.left,
                        y,
                        CONTENT_WIDTH,
                        h
                    );

                    setHeading(11);

                    doc.text(
                        item.title,
                        PAGE.left + 25,
                        y + 20
                    );

                    setMuted(10);

                    doc.text(
                        item.text,
                        PAGE.left + 25,
                        y + 50,
                        {
                            width:
                                CONTENT_WIDTH -
                                50,
                            height:
                                h - 70,
                            lineGap: 3,
                        }
                    );

                    doc.y =
                        y +
                        h +
                        15;
                }
            );

            // ========================================================
            // RELATIONSHIPS
            // ========================================================

            newPage(
                "V. LOVE & RELATIONSHIPS"
            );

            const relationshipNumber =
                lifePath ||
                birthNumber;

            const relationshipMeaning =
                relationshipNumber
                    ? getMeaning(
                          Number(
                              relationshipNumber
                          )
                      )
                    : null;

            const relationshipCards = [
                {
                    title:
                        "EMOTIONAL NATURE",
                    text:
                        relationshipMeaning
                            ? `Your primary number ${
                                  relationshipNumber
                              } carries the ${
                                  relationshipMeaning.title.toLowerCase()
                              } archetype in this report. This can influence how you process connection, trust and emotional experiences.`
                            : "A complete emotional interpretation requires valid core numerology data.",
                },

                {
                    title:
                        "COMMUNICATION",
                    text:
                        "Healthy relationships benefit from direct communication, realistic expectations and enough personal space for both people to remain authentic.",
                },

                {
                    title:
                        "RELATIONSHIP GROWTH",
                    text:
                        "The most useful numerology approach is to identify recurring patterns, then consciously improve communication, boundaries and emotional awareness rather than treating numbers as fixed destiny.",
                },

                {
                    title:
                        "PARTNERSHIP GUIDANCE",
                    text:
                        "Look for relationships that encourage mutual respect, honest communication and personal growth. Compatibility is best evaluated through real behavior and shared values as well as numerological symbolism.",
                },
            ];

            relationshipCards.forEach(
                (item) => {
                    const h =
                        Math.max(
                            130,
                            90 +
                                getTextHeight(
                                    item.text,
                                    CONTENT_WIDTH -
                                        50,
                                    10,
                                    3
                                )
                        );

                    if (
                        doc.y + h >
                        PAGE.contentBottom
                    ) {
                        newPage(
                            "V. LOVE & RELATIONSHIPS"
                        );
                    }

                    const y =
                        doc.y;

                    drawCard(
                        PAGE.left,
                        y,
                        CONTENT_WIDTH,
                        h
                    );

                    setHeading(11);

                    doc.text(
                        item.title,
                        PAGE.left + 25,
                        y + 20
                    );

                    setMuted(10);

                    doc.text(
                        item.text,
                        PAGE.left + 25,
                        y + 50,
                        {
                            width:
                                CONTENT_WIDTH -
                                50,
                            height:
                                h - 70,
                            lineGap: 3,
                        }
                    );

                    doc.y =
                        y +
                        h +
                        15;
                }
            );

            // ========================================================
            // PERSONAL CYCLE
            // ========================================================

            newPage(
                "VI. PERSONAL YEAR & LIFE CYCLES"
            );

            const currentYear =
                new Date().getFullYear();

            const dobDigits =
                getDOBDigits();

            let personalYear = null;

            if (
                dobDigits.length === 8
            ) {
                const month =
                    Number(
                        dobDigits.slice(
                            4,
                            6
                        )
                    );

                const day =
                    Number(
                        dobDigits.slice(
                            6,
                            8
                        )
                    );

                const yearDigits =
                    String(
                        currentYear
                    )
                        .split("")
                        .reduce(
                            (
                                sum,
                                digit
                            ) =>
                                sum +
                                Number(
                                    digit
                                ),
                            0
                        );

                personalYear =
                    reduceNumber(
                        month +
                            day +
                            yearDigits
                    );
            }

            const cycleMeaning =
                personalYear
                    ? getMeaning(
                          Number(
                              personalYear
                          )
                      )
                    : null;

            const cycleText =
                personalYear
                    ? `For ${currentYear}, your calculated Personal Year is ${
                          personalYear
                      }. In this interpretive framework, the number is associated with ${
                          cycleMeaning.title.toLowerCase()
                      }. Use the cycle as a planning theme rather than a fixed prediction.`
                    : "A Personal Year can be calculated when a valid date of birth is available.";

            drawCard(
                PAGE.left,
                PAGE.contentTop,
                CONTENT_WIDTH,
                190
            );

            setHeading(12);

            doc.text(
                `PERSONAL YEAR ${
                    currentYear
                }`,
                PAGE.left + 25,
                PAGE.contentTop + 25
            );

            setBody(30);

            doc.text(
                personalYear
                    ? String(
                          personalYear
                      )
                    : "N/A",
                PAGE.left + 25,
                PAGE.contentTop + 52
            );

            setMuted(10.5);

            doc.text(
                cycleText,
                PAGE.left + 25,
                PAGE.contentTop + 105,
                {
                    width:
                        CONTENT_WIDTH -
                        50,
                    height: 65,
                    lineGap: 3,
                }
            );

            // ========================================================
            // SACRED REMEDIES
            // ========================================================

            newPage(
                "VII. SACRED REMEDIES"
            );

            const apiRemedies =
                Array.isArray(
                    safeApiData.remedies
                )
                    ? safeApiData.remedies
                    : [];

            const remedies =
                apiRemedies.length
                    ? apiRemedies
                          .map(
                              (
                                  item,
                                  index
                              ) => {
                                  if (
                                      item &&
                                      typeof item ===
                                          "object"
                                  ) {
                                      return {
                                          title:
                                              item.title ||
                                              item.name ||
                                              `REMEDY ${
                                                  index +
                                                  1
                                              }`,
                                          description:
                                              item.description ||
                                              item.detailed_meaning ||
                                              item.meaning ||
                                              "",
                                      };
                                  }

                                  return {
                                      title:
                                          `REMEDY ${
                                              index +
                                              1
                                          }`,
                                      description:
                                          String(
                                              item
                                          ),
                                  };
                              }
                          )
                          .filter(
                              (item) =>
                                  item.description
                          )
                    : [
                          {
                              title:
                                  "LUCKY COLORS",
                              description:
                                  "Gold, cream and deep yellow may be used symbolically as supportive colors in this traditional numerology framework.",
                          },

                          {
                              title:
                                  "FAVORABLE DAYS",
                              description:
                                  "Sunday and Thursday may be treated as supportive days for reflection, planning and spiritual practices within this traditional interpretation.",
                          },

                          {
                              title:
                                  "MANTRA & MEDITATION",
                              description:
                                  "A consistent meditation or mantra practice can be used as a mindfulness discipline. Choose a practice that is personally meaningful and maintain it consistently.",
                          },

                          {
                              title:
                                  "CHARITY & SERVICE",
                              description:
                                  "Acts of generosity, service and gratitude can be used as practical spiritual disciplines to cultivate perspective and positive habits.",
                          },

                          {
                              title:
                                  "GEMSTONE GUIDANCE",
                              description:
                                  "Gemstones should not be treated as guaranteed solutions. If you choose to use one, consult a qualified practitioner before wearing it, especially when following a specific astrological tradition.",
                          },
                      ];

            remedies.forEach(
                (item) => {
                    const description =
                        String(
                            item.description
                        );

                    const h =
                        Math.max(
                            130,
                            90 +
                                Math.min(
                                    250,
                                    getTextHeight(
                                        description,
                                        CONTENT_WIDTH -
                                            50,
                                        10,
                                        3
                                    )
                                )
                        );

                    if (
                        doc.y + h >
                        PAGE.contentBottom
                    ) {
                        newPage(
                            "VII. SACRED REMEDIES"
                        );
                    }

                    const y =
                        doc.y;

                    drawCard(
                        PAGE.left,
                        y,
                        CONTENT_WIDTH,
                        h
                    );

                    setHeading(11);

                    doc.text(
                        String(
                            item.title
                        ).toUpperCase(),
                        PAGE.left + 25,
                        y + 20,
                        {
                            width:
                                CONTENT_WIDTH -
                                50,
                        }
                    );

                    doc
                        .moveTo(
                            PAGE.left + 25,
                            y + 43
                        )
                        .lineTo(
                            PAGE.left + 100,
                            y + 43
                        )
                        .lineWidth(1.5)
                        .strokeColor(
                            colors.gold
                        )
                        .stroke();

                    setMuted(10);

                    doc.text(
                        description,
                        PAGE.left + 25,
                        y + 57,
                        {
                            width:
                                CONTENT_WIDTH -
                                50,
                            height:
                                h - 75,
                            lineGap: 3,
                        }
                    );

                    doc.y =
                        y +
                        h +
                        15;
                }
            );

            // ========================================================
            // FINAL GUIDANCE
            // ========================================================

            newPage(
                "VIII. FINAL GUIDANCE"
            );

            const finalNumber =
                lifePath ||
                birthNumber;

            const finalMeaning =
                finalNumber
                    ? getMeaning(
                          Number(
                              finalNumber
                          )
                      )
                    : null;

            const finalSections = [
                {
                    title:
                        "YOUR CENTRAL THEME",
                    text:
                        finalMeaning
                            ? `The central theme highlighted by your ${
                                  finalNumber
                              } pattern is ${
                                  finalMeaning.title.toLowerCase()
                              }. This theme becomes most constructive when it is expressed through practical action rather than remaining only an idea.`
                            : "Your central numerology theme will become clearer when the calculation service returns the required core numbers.",
                },

                {
                    title:
                        "YOUR NEXT STEP",
                    text:
                        "Use this report as a structured reflection tool. Identify one strength to develop, one habit to improve and one practical goal to pursue. Consistent action is more valuable than trying to change everything at once.",
                },

                {
                    title:
                        "IMPORTANT NOTE",
                    text:
                        "Numerology describes symbolic tendencies and traditional interpretations. It should be used for self-reflection and spiritual guidance rather than as a guaranteed prediction of future events or as a substitute for professional financial, medical or legal advice.",
                },
            ];

            finalSections.forEach(
                (item) => {
                    const h =
                        Math.max(
                            145,
                            95 +
                                getTextHeight(
                                    item.text,
                                    CONTENT_WIDTH -
                                        50,
                                    10.5,
                                    3
                                )
                        );

                    if (
                        doc.y + h >
                        PAGE.contentBottom
                    ) {
                        newPage(
                            "VIII. FINAL GUIDANCE"
                        );
                    }

                    const y =
                        doc.y;

                    drawCard(
                        PAGE.left,
                        y,
                        CONTENT_WIDTH,
                        h
                    );

                    setHeading(11);

                    doc.text(
                        item.title,
                        PAGE.left + 25,
                        y + 20
                    );

                    setMuted(10.5);

                    doc.text(
                        item.text,
                        PAGE.left + 25,
                        y + 55,
                        {
                            width:
                                CONTENT_WIDTH -
                                50,
                            height:
                                h - 75,
                            lineGap: 3,
                        }
                    );

                    doc.y =
                        y +
                        h +
                        15;
                }
            );

            // Closing message

            if (
                doc.y + 120 >
                PAGE.contentBottom
            ) {
                newPage(
                    "VIII. FINAL GUIDANCE"
                );
            }

            const closingY =
                doc.y + 10;

            drawCard(
                PAGE.left,
                closingY,
                CONTENT_WIDTH,
                105
            );

            setHeading(15);

            doc.text(
                "May Divine Wisdom Guide Your Journey",
                0,
                closingY + 20,
                {
                    width:
                        PAGE.width,
                    align: "center",
                }
            );

            setMuted(9.5);

            doc.text(
                "Prepared according to the principles of Ancient Vedic Numerology for guidance, self-awareness and spiritual reflection.",
                PAGE.left + 30,
                closingY + 52,
                {
                    width:
                        CONTENT_WIDTH - 60,
                    align: "center",
                    lineGap: 3,
                }
            );

            setHeading(10);

            doc.text(
                "ACTROVASTUCONNECT • ANCIENT VEDIC NUMEROLOGY",
                0,
                closingY + 82,
                {
                    width:
                        PAGE.width,
                    align: "center",
                    characterSpacing: 1,
                }
            );

            // ========================================================
            // PAGE NUMBERS
            // ========================================================

            const pageRange =
                doc.bufferedPageRange();

            for (
                let i = 0;
                i < pageRange.count;
                i++
            ) {
                doc.switchToPage(i);

                setSmallMuted();

                doc.text(
                    `Page ${i + 1} of ${
                        pageRange.count
                    }`,
                    0,
                    PAGE.height - 38,
                    {
                        width:
                            PAGE.width,
                        align: "center",
                    }
                );
            }

            // ========================================================
            // FINISH
            // ========================================================

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

// ================================================================
// EXPORT
// ================================================================

module.exports = {
    generateNumerologyPDF,
};