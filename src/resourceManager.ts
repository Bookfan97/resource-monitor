import {cpuInfo, memoryInfo, refreshCpu, refreshMemory, disks, uptime} from "tauri-plugin-system-info-api";
import { info, error } from '@tauri-apps/plugin-log';
import { platform } from '@tauri-apps/plugin-os';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { isTauri } from '@tauri-apps/api/core';
const POLLING_INTERVAL = 1000;
const currentPlatform = platform();

export function pollResources() {
    info(`Starting resource polling. isTauri: ${isTauri()}`);
    if (!isTauri()) {
        info("Not running in Tauri, skipping resource polling");
        return () => {};
    }
    const interval = setInterval(async () => {
        try {
            const cpuData = await getCpuData();
            const ramUsage = await getRAMUsage();
            const storageData = await getStorageData();
            
            console.log("Stats collected:", { cpuData, ramUsage, storageData });
            
            // Calculate uptime
            let uptimeSeconds = 0;
            try {
                uptimeSeconds = await uptime();
            } catch (e) {
                // error(`Error getting uptime: ${e}`);
                uptimeSeconds = 0;
            }
            
            const days = Math.floor(uptimeSeconds / (24 * 3600));
            const hours = Math.floor((uptimeSeconds % (24 * 3600)) / 3600);
            const minutes = Math.floor((uptimeSeconds % 3600) / 60);
            const seconds = Math.floor(uptimeSeconds % 60);
            const uptimeStr = `${days}:${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

            const statistics: Statistics = {
                cpuUsage: Math.round(cpuData.usage),
                ramUsage: Math.round(ramUsage),
                storageUsage: Math.round(storageData.usage * 100),
                cpuSpeed: parseFloat(cpuData.speed.toFixed(2)),
                processes: 150 + Math.floor(Math.random() * 20), // Randomized for demo
                threads: 2000 + Math.floor(Math.random() * 500),
                handles: 80000 + Math.floor(Math.random() * 10000),
                uptime: uptimeStr,
                ramCommitted: `${(ramUsage * 0.4).toFixed(1)}/32.0 GB`,
                ramCached: "4.2 GB",
                ramPaged: "640 MB",
                ramNonPaged: "320 MB",
                storageResponseTime: "0.5 ms",
                storageReadSpeed: "0 KB/s",
                storageWriteSpeed: "124 KB/s",
            };
            
            await getCurrentWindow().emit('statistics', statistics);
        } catch (e) {
            error(`Error in polling loop: ${e instanceof Error ? e.message : String(e)}`);
        }
    }, POLLING_INTERVAL);
    return () => clearInterval(interval);
}

async function getCpuData(): Promise<{ usage: number; speed: number }> {
    try {
        await refreshCpu();
        const info = await cpuInfo();
        if (info.cpus && info.cpus.length > 0) {
            const totalUsage = info.cpus.reduce((acc, cpu) => acc + cpu.cpu_usage, 0);
            const totalFrequency = info.cpus.reduce((acc, cpu) => acc + cpu.frequency, 0);
            return {
                usage: totalUsage / info.cpus.length,
                speed: (totalFrequency / info.cpus.length) / 1000, // Convert MHz to GHz
            };
        } else {
            error("No CPU data returned from system-info");
        }
        return { usage: 0, speed: 0 };
    } catch (e) {
        error(`Error getting CPU data: ${e instanceof Error ? e.message : String(e)}`);
        return { usage: 0, speed: 0 };
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
        info(`Found disks: ${JSON.stringify(allDisks)}`);
        // Fallback to first disk or a default value if no disks found
        const mainDisk = allDisks.find(d => d.mount_point === (currentPlatform === 'windows' ? 'C:\\' : '/')) || allDisks[0];

        if (mainDisk) {
            const total = mainDisk.total_space;
            const free = mainDisk.available_space;

            if (Number.isFinite(total) && total > 0 && Number.isFinite(free)) {
                return {
                    total: Math.floor(total / (1024 * 1024 * 1024)),
                    usage: 1 - free / total,
                };
            } else {
                return {
                    total: 0,
                    usage: 0,
                };
            }
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
    if (!isTauri()) {
        return {
            totalStorage: 512,
            cpuModel: "Demo CPU",
            totalMemoryGB: 16,
            logicalProcessors: 8,
            cores: 4,
        };
    }
    const storageData = await getStorageData();
    await refreshCpu();
    const cpu = await cpuInfo();
    await refreshMemory();
    const mem = await memoryInfo();

    return {
        totalStorage: storageData.total,
        cpuModel: cpu.cpus[0]?.brand || "Unknown",
        totalMemoryGB: Math.floor(mem.total_memory / (1024 * 1024 * 1024)),
        logicalProcessors: cpu.cpus.length,
        cores: cpu.cpus.length / 2, // Approximation
    };
}