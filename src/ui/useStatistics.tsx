import { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';

export function useStatistics(dataPointCount: number): Statistics[] {
    const [value, setValue] = useState<Statistics[]>([]);

    useEffect(() => {
        const unlistenPromise = listen<Statistics>('statistics', (event) =>
            setValue((prev) => {
                const newData = [...prev, event.payload];

                if (newData.length > dataPointCount) {
                    newData.shift();
                }

                return newData;
            })
        );
        return () => {
            unlistenPromise.then(unlisten => unlisten());
        };
    }, [dataPointCount]);

    return value;
}