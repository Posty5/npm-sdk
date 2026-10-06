import { createHash } from 'crypto';
import { renderDesignSvg } from '../src';
import type { IQrDesignOptions, IQrRenderResult } from '../src';
import fixtureFile from './fixtures.json';

/** A fixed 1×1 orange PNG, so logo fixtures are deterministic. */
export const FIXTURE_LOGO =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

export interface IFixture {
    name: string;
    options: IQrDesignOptions;
    logo?: boolean;
}

export const FIXTURE_TEXT: string = fixtureFile.text;

export const FIXTURES: IFixture[] = fixtureFile.fixtures.map((f) => ({
    name: f.name,
    options: { ...fixtureFile.base, ...f.options } as IQrDesignOptions,
    logo: (f as { logo?: boolean }).logo,
}));

export const renderFixture = (f: IFixture, sizePx = 800): IQrRenderResult =>
    renderDesignSvg(f.options, FIXTURE_TEXT, { sizePx, logoDataUri: f.logo ? FIXTURE_LOGO : undefined });

export const sha256 = (value: string): string => createHash('sha256').update(value).digest('hex');
