import { useEffect, useRef } from 'react';
import type { CmsWidgetControlProps } from 'decap-cms-core';

// Decap passes `locale` to widgets in i18n-enabled collections but doesn't
// expose it via CmsWidgetControlProps. Mint only in the default-locale pane
// so `i18n: duplicate` syncs the same id into every other pane — otherwise
// each pane races to mint its own UUID and per-locale files end up with
// divergent ids.
type Props = CmsWidgetControlProps<string> & { locale?: string };

const DEFAULT_LOCALE = 'en';

export function Uuid({ forID, classNameWrapper, value, onChange, locale }: Props) {
    // Lock once any value is observed (minted by us, loaded from storage, or
    // synced by i18n: duplicate) so the widget never rotates an existing id,
    // even if the value is later transiently cleared or the effect is replayed
    // by strict mode / Fast Refresh / future remount-like features.
    const locked = useRef(false)

    useEffect(() => {
        if (locked.current) return
        if (value) {
            locked.current = true
            return
        }
        if (locale && locale !== DEFAULT_LOCALE) return
        onChange(crypto.randomUUID())
        locked.current = true
    }, [value, locale, onChange])

    return (
        <div className={classNameWrapper}>
            <input type="hidden" id={forID} value={value} />
            <code>{value}</code>
        </div>
    );
}
