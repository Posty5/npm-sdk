import type { IQrCtaPreset } from '../interface';

/**
 * CTA presets (K3). The editor writes the translated string into `frame.text`;
 * `text` here is the en/ar copy the i18n keys `qrDesign.cta.<id>` must match.
 */
export const QrCtaPresets: readonly IQrCtaPreset[] = [
    { id: 'scanMe', labelKey: 'qrDesign.cta.scanMe', text: { en: 'SCAN ME', ar: 'امسحني' } },
    { id: 'scanForMenu', labelKey: 'qrDesign.cta.scanForMenu', text: { en: 'Scan for menu', ar: 'امسح لعرض القائمة' } },
    { id: 'scanToVisit', labelKey: 'qrDesign.cta.scanToVisit', text: { en: 'Scan to visit', ar: 'امسح للزيارة' } },
    { id: 'scanForWifi', labelKey: 'qrDesign.cta.scanForWifi', text: { en: 'Scan for Wi-Fi', ar: 'امسح للاتصال بالواي فاي' } },
    { id: 'scanToContact', labelKey: 'qrDesign.cta.scanToContact', text: { en: 'Scan to save contact', ar: 'امسح لحفظ جهة الاتصال' } },
    { id: 'scanToReview', labelKey: 'qrDesign.cta.scanToReview', text: { en: 'Scan to review us', ar: 'امسح لتقييمنا' } },
];
