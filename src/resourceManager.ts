import { cpuInfo, refreshCpu } from "tauri-plugin-system-info-api";
import { warn, debug, trace, info, error } from '@tauri-apps/plugin-log';
const POLLING_INTERVAL = 500;

export function pollResources() {
    const interval = setInterval(async () => {
        const cpuUsage = await getCpuUsage();
        info(`CPU usage: ${cpuUsage}%`);
    }, POLLING_INTERVAL);
    return () => clearInterval(interval);
}

async function getCpuUsage(): Promise<number> {
    try {
        await refreshCpu();
        const info = await cpuInfo();
        if (info.cpus && info.cpus.length > 0) {
            const totalUsage = info.cpus.reduce((acc, cpu) => acc + cpu.cpu_usage, 0);
            return totalUsage / info.cpus.length;
        }
        return 0;
    } catch (e) {
        error(`Error getting CPU usage: ${e instanceof Error ? e.message : String(e)}`);
        return 0;
    }
}