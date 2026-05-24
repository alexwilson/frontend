import { useEffect } from 'react';
import type { CmsWidgetControlProps } from 'decap-cms-core';

// Decap passes `locale` to widgets in i18n-enabled collections but doesn't
// expose it via CmsWidgetControlProps. Mint only in the default-locale pane
// so `i18n: duplicate` syncs the same id into every other pane — otherwise
// each pane races to mint its own UUID and per-locale files end up with
// divergent ids.
type Props = CmsWidgetControlProps<string> & { locale?: string };

const DEFAULT_LOCALE = 'en';

export function Uuid({ forID, classNameWrapper, value, onChange, locale }: Props) {
    // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally mount-only; re-running on value/onChange changes would regenerate the UUID
    useEffect(() => {
        if (value) return
        if (locale && locale !== DEFAULT_LOCALE) return
        onChange(crypto.randomUUID())
    }, [])

    return (
        <div className={classNameWrapper}>
            <input type="hidden" id={forID} value={value} />
            <code>{value}</code>
        </div>
    );
}
