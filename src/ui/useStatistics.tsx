import { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';

export function useStatistics(dataPointCount: number): Statistics[] {
    const [value, setValue] = useState<Statistics[]>([]);

    useEffect(() => {
        console.log("Setting up statistics listener");
        const unlistenPromise = getCurrentWindow().listen<Statistics>('statistics', (event) => {
            console.log("Received statistics event:", event.payload);
            setValue((prev) => {
                const newData = [...prev, event.payload];

                if (newData.length > dataPointCount) {
                    newData.shift();
                }

                return newData;
            });
        });
        return () => {
            unlistenPromise.then(unlisten => unlisten());
        };
    }, [dataPointCount]);

    return value;
}