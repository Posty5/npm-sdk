import type { IQrFrameDefinition } from '../interface';

/** Frame catalogue (K3). Labels are i18n keys `qrDesign.frame.<id>`. */
export const QrFrames: readonly IQrFrameDefinition[] = [
    { id: 'title-strip', labelKey: 'qrDesign.frame.title-strip', hasText: true, defaultColor: '#ffffff', defaultTextColor: '#000000' },
    { id: 'banner-bottom', labelKey: 'qrDesign.frame.banner-bottom', hasText: true, defaultColor: '#000000', defaultTextColor: '#ffffff' },
    { id: 'banner-top', labelKey: 'qrDesign.frame.banner-top', hasText: true, defaultColor: '#000000', defaultTextColor: '#ffffff' },
    { id: 'rounded-box', labelKey: 'qrDesign.frame.rounded-box', hasText: true, defaultColor: '#000000', defaultTextColor: '#000000' },
    { id: 'speech-bubble', labelKey: 'qrDesign.frame.speech-bubble', hasText: true, defaultColor: '#000000', defaultTextColor: '#ffffff' },
    { id: 'ticket', labelKey: 'qrDesign.frame.ticket', hasText: true, defaultColor: '#000000', defaultTextColor: '#ffffff' },
    { id: 'circle-ring', labelKey: 'qrDesign.frame.circle-ring', hasText: true, defaultColor: '#000000', defaultTextColor: '#ffffff' },
];
