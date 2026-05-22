import {cpuInfo, memoryInfo, refreshCpu, refreshMemory, disks} from "tauri-plugin-system-info-api";
import { info, error } from '@tauri-apps/plugin-log';
import { platform } from '@tauri-apps/plugin-os';
import { emit } from '@tauri-apps/api/event';
const POLLING_INTERVAL = 500;
const currentPlatform = platform();

export function pollResources() {
    const interval = setInterval(async () => {
        const cpuUsage = await getCpuUsage();
        const ramUsage = await getRAMUsage();
        const storageData = await getStorageData();
        const statistics: Statistics = {
            cpuUsage,
            ramUsage,
            storageUsage: storageData.usage * 100,
        };
        emit('statistics', statistics);
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

async function getStorageData() {
    try {
        const allDisks = await disks();
        // Fallback to first disk or a default value if no disks found
        const mainDisk = allDisks.find(d => d.mount_point === (currentPlatform === 'windows' ? 'C:\\' : '/')) || allDisks[0];

        if (mainDisk) {
            const total = mainDisk.total_space;
            const free = mainDisk.available_space;
            return {
                total: Math.floor(total / (1024 * 1024 * 1024)),
                usage: 1 - free / total,
            };
        }
    } catch (e) {
        error(`Error getting storage data: ${e instanceof Error ? e.message : String(e)}`);
    }

    return {
        total: 0,
        usage: 0,
    };
}

export async function getStaticData() {
    const storageData = await getStorageData();
    await refreshCpu();
    const cpu = await cpuInfo();
    await refreshMemory();
    const mem = await memoryInfo();

    return {
        totalStorage: storageData.total,
        cpuModel: cpu.cpus[0]?.brand || "Unknown",
        totalMemoryGB: Math.floor(mem.total_memory / (1024 * 1024 * 1024)),
    };
}