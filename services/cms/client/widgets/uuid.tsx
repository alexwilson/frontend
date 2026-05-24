import { useEffect } from 'react';
import type { CmsWidgetControlProps } from 'decap-cms-core';

export function Uuid({ forID, classNameWrapper, value, onChange }: CmsWidgetControlProps<string>) {
    // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally mount-only; re-running on value/onChange changes would regenerate the UUID
    useEffect(() => {
        if (!value) onChange(crypto.randomUUID())
    }, [])

    return (
        <div className={classNameWrapper}>
            <input type="hidden" id={forID} value={value} />
            <code>{value}</code>
        </div>
    );
}
