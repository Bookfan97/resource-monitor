import {cpuInfo, memoryInfo, refreshCpu, refreshMemory} from "tauri-plugin-system-info-api";
import { info, error } from '@tauri-apps/plugin-log';
const POLLING_INTERVAL = 500;

export function pollResources() {
    const interval = setInterval(async () => {
        const cpuUsage = await getCpuUsage();
        const ramUsage = await getRAMUsage();
        info(`CPU usage: ${cpuUsage}%`);
        info(`RAM usage: ${ramUsage}%`);
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

async function getRAMUsage() {
    try {
        await refreshMemory();
        const info = await memoryInfo();
        if (info.total_memory > 0) {
            return (info.used_memory / info.total_memory) * 100;
        }
        return 0;
    } catch (e) {
        error(`Error getting RAM usage: ${e instanceof Error ? e.message : String(e)}`);
        return 0;
    }
}