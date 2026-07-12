type Statistics = {
    cpuUsage: number;
    ramUsage: number;
    storageUsage: number;
    cpuSpeed?: number;
    processes?: number;
    threads?: number;
    handles?: number;
    uptime?: string;
    ramCommitted?: string;
    ramCached?: string;
    ramPaged?: string;
    ramNonPaged?: string;
    storageResponseTime?: string;
    storageReadSpeed?: string;
    storageWriteSpeed?: string;
};

type StaticData = {
    totalStorage: number;
    cpuModel: string;
    totalMemoryGB: number;
    logicalProcessors?: number;
    cores?: number;
};

type View = 'CPU' | 'RAM' | 'STORAGE';
