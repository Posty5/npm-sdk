/** Frame proportions, as shares of the symbol box edge (symbol + quiet zone). */
export const QR_FRAME_GEOMETRY = {
    /** Light padding between the symbol box and the frame. */
    padding: 0.06,
    /** Border thickness. */
    border: 0.04,
    /** Height of the CTA text area. */
    textArea: 0.2,
    /** Outer corner radius. */
    radius: 0.06,
    /** Legacy title strip height. */
    titleStrip: 0.18,
    /** Horizontal inset of text inside its area. */
    textInset: 0.05,
    /** Speech-bubble pointer height and half width. */
    pointer: 0.07,
    /** Gap between box and bubble. */
    bubbleGap: 0.02,
    /** Ticket notch radius. */
    notch: 0.05,
    /** Ring thickness and CTA pill size of `circle-ring`. */
    ring: 0.16,
    pillWidth: 0.8,
    pillHeight: 0.15,
} as const;
