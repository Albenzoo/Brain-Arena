
// ═══════════════════════════════════════════════════════════════════════════
// 🎯 MAIN PALETTE
// ═══════════════════════════════════════════════════════════════════════════

export const Colors = {
    // Purple
    primary: '#6B25C4',           // Deep purple (base)
    primaryLight: '#9B5DFF',      // Light purple (accents, gradients)
    primaryDark: '#4A1A99',       // Dark purple (panel backgrounds)

    // Gold/Yellow
    gold: '#FFC93C',              // Warm gold yellow (borders, accents)
    goldDark: '#D9A500',          // Dark gold (border shadows)

    // Neutrals
    white: '#FFFFFF',             // Main text
    black80: '#141414',           // Soft shadows

    // Feedback
    correct: '#00FFBF',           // Fluorescent aqua green
    incorrect: '#FF2B6D',         // Magenta red
    selected: '#FFC93C',          // Gold (selection)
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// 🟪 QUESTION PANEL
// ═══════════════════════════════════════════════════════════════════════════

export const QuestionPanelTheme = {
    // Background
    background: {
        gradientStart: '#2d1a62',     // Dark purple
        gradientEnd: '#2d1a62',       // Primary purple
    },

    // Border
    border: {
        color: '#e9ad41',             // Gold
        width: 15,
        radius: 24,
    },

    // Text
    text: {
        color: '#FFFFFF',
        shadowColor: 'rgba(0, 0, 0, 0.5)',
        shadowOffset: 2,
        font: 'bold 28px sans-serif',
        progressFont: 'bold 20px sans-serif',
        progressColor: '#FFC93C',
    },

    // Separator line (below progress)
    separator: {
        color: '#FFC93C',
        height: 3,
        marginY: 12,
    },

    // Outer glow (optional)
    glow: {
        color: 'rgba(255, 201, 60, 0.2)',
        blur: 20,
    },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// 🟨 ANSWER BUTTONS
// ═══════════════════════════════════════════════════════════════════════════

export const AnswerButtonTheme = {
    // Dimensions
    height: 70,                       // px (target height 60-80)
    paddingH: 32,
    paddingV: 20,
    borderRadius: 35,                 // Pill shape (half of height)

    // Background
    background: {
        gradientStart: '#9B5DFF',     // Light purple
        gradientEnd: '#7B3FDF',       // Medium purple
    },

    // Border
    border: {
        color: '#D9A500',             // Dark gold
        width: 4,
    },

    // Text
    text: {
        color: '#FFFFFF',
        font: 'bold 26px sans-serif',
        shadowColor: 'rgba(0, 0, 0, 0.3)',
    },

    // States
    states: {
        idle: {
            background: '#9B5DFF',
            border: '#D9A500',
            scale: 1.0,
        },
        hover: {
            background: '#AB6DFF',
            border: '#FFC93C',
            scale: 1.03,
            glowColor: 'rgba(255, 201, 60, 0.3)',
            glowBlur: 15,
        },
        selected: {
            background: '#6B25C4',    // Deeper purple
            border: '#FFC93C',
            scale: 1.05,
        },
        correct: {
            background: '#00FFBF',
            border: '#00CC99',
            textColor: '#141414',
        },
        incorrect: {
            background: '#FF2B6D',
            border: '#CC2255',
            textColor: '#FFFFFF',
        },
    },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// 🎯 MENU BUTTONS
// ═══════════════════════════════════════════════════════════════════════════

export const MenuButtonTheme = {
    // Dimensions
    height: 60,
    paddingH: 40,
    paddingV: 18,
    borderRadius: 30,

    // Background
    background: {
        gradientStart: '#9B5DFF',
        gradientEnd: '#7B3FDF',
    },

    // Border
    border: {
        color: '#FFC93C',
        width: 4,
    },

    // Text
    text: {
        color: '#FFFFFF',
        font: 'bold 28px sans-serif',
    },

    // States
    states: {
        idle: 0x9B5DFF,
        hover: 0xAB6DFF,
        pressed: 0x6B25C4,
    },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// 🏷️ LOGO PANEL
// ═══════════════════════════════════════════════════════════════════════════

export const LogoPanelTheme = {
    border: {
        color: '#FFC93C',
        width: 6,
        radius: 24,
    },
    background: {
        gradientStart: '#4A1A99',
        gradientEnd: '#6B25C4',
    },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// 🔧 HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Draws a rectangle with rounded corners
 */
export function drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.arcTo(x + width, y, x + width, y + radius, radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    ctx.lineTo(x + radius, y + height);
    ctx.arcTo(x, y + height, x, y + height - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();
}

/**
 * Creates a vertical gradient
 */
export function createVerticalGradient(
    ctx: CanvasRenderingContext2D,
    height: number,
    startColor: string,
    endColor: string
): CanvasGradient {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, startColor);
    gradient.addColorStop(1, endColor);
    return gradient;
}

/**
 * Applies soft shadow to the context
 */
export function applySoftShadow(
    ctx: CanvasRenderingContext2D,
    color: string = 'rgba(0, 0, 0, 0.3)',
    blur: number = 10,
    offsetY: number = 4
): void {
    ctx.shadowColor = color;
    ctx.shadowBlur = blur;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = offsetY;
}

/**
 * Resets shadows
 */
export function resetShadow(ctx: CanvasRenderingContext2D): void {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
}
