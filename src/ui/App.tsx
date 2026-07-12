import { useEffect, useMemo, useState } from 'react';
import { useStatistics } from './useStatistics';
import { Chart } from './Chart';
import { getStaticData } from '../resourceManager';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { isTauri } from '@tauri-apps/api/core';
import { cn } from '../lib/utils';

function App() {
  const staticData = useStaticData();
  const statistics = useStatistics(60);
  const [activeView, setActiveView] = useState<View>('CPU');
  const cpuUsages = useMemo(
      () => statistics.map((stat) => stat.cpuUsage),
      [statistics]
  );
  const ramUsages = useMemo(
      () => statistics.map((stat) => stat.ramUsage),
      [statistics]
  );
  const storageUsages = useMemo(
      () => statistics.map((stat) => stat.storageUsage),
      [statistics]
  );
  const activeUsages = useMemo(() => {
    switch (activeView) {
      case 'CPU':
        return cpuUsages;
      case 'RAM':
        return ramUsages;
      case 'STORAGE':
        return storageUsages;
      default:
        return [];
    }
  }, [activeView, cpuUsages, ramUsages, storageUsages]);

  useEffect(() => {
    if (!isTauri()) {
      return () => {};
    }

    const unlistenPromise = getCurrentWindow().listen<View>('changeView', (event) => {
      const payload = event.payload;
      if (payload === 'CPU' || payload === 'RAM' || payload === 'STORAGE') {
        setActiveView(payload);
      }
    });
    return () => {
        unlistenPromise.then(unlisten => unlisten());
    };
  }, []);

  const latestStats = statistics[statistics.length - 1] || { cpuUsage: 0, ramUsage: 0, storageUsage: 0 };
  const cpuModelShort = staticData?.cpuModel.split(' @')[0] ?? '';

  return (
      <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
        <div className="flex flex-1 overflow-hidden">
          <div className="w-[280px] bg-sidebar border-r border-sidebar-border overflow-y-auto">
            <SelectOption
                onClick={() => setActiveView('CPU')}
                title="CPU"
                view="CPU"
                isActive={activeView === 'CPU'}
                subTitle={`${latestStats.cpuUsage}%`}
                data={cpuUsages}
            />
            <SelectOption
                onClick={() => setActiveView('RAM')}
                title="Memory"
                view="RAM"
                isActive={activeView === 'RAM'}
                subTitle={`${(latestStats.ramUsage * (staticData?.totalMemoryGB ?? 16) / 100).toFixed(1)}/${staticData?.totalMemoryGB ?? 16} GB (${Math.round(latestStats.ramUsage)}%)`}
                data={ramUsages}
            />
            <SelectOption
                onClick={() => setActiveView('STORAGE')}
                title="Disk 0 (C:)"
                view="STORAGE"
                isActive={activeView === 'STORAGE'}
                subTitle={`${latestStats.storageUsage}%`}
                data={storageUsages}
            />
          </div>
          <div className="flex-1 p-6 flex flex-col gap-5 overflow-y-auto">
            <div className="flex justify-between items-start">
                <h2 className="text-2xl font-normal">{activeView === 'RAM' ? 'Memory' : activeView === 'STORAGE' ? 'Disk 0 (C:)' : activeView}</h2>
                <div className="text-muted-foreground text-xl">{activeView === 'CPU' ? cpuModelShort : ''}</div>
            </div>
            <div className="h-[300px] w-full bg-[#1c1c1c] border border-[#333] relative">
                <div className="absolute top-1.5 right-2.5 text-muted-foreground text-xs z-10">% Utilization</div>
                <Chart
                    selectedView={activeView}
                    data={activeUsages}
                    maxDataPoints={60}
                />
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
                {activeView === 'CPU' && (
                    <>
                        <StatItem label="Utilization" value={`${latestStats.cpuUsage}%`} />
                        <StatItem label="Speed" value={`${latestStats.cpuSpeed ?? '3.40'} GHz`} />
                        <StatItem label="Processes" value={(latestStats.processes ?? 0).toString()} />
                        <StatItem label="Threads" value={(latestStats.threads ?? 0).toString()} />
                        <StatItem label="Handles" value={(latestStats.handles ?? 0).toString()} />
                        <StatItem label="Up time" value={latestStats.uptime ?? '0:00:00:00'} />
                    </>
                )}
                {activeView === 'RAM' && (
                    <>
                        <StatItem label="In use (Compressed)" value={`${(latestStats.ramUsage * (staticData?.totalMemoryGB ?? 16) / 100).toFixed(1)} GB (120 MB)`} />
                        <StatItem label="Available" value={`${((100 - latestStats.ramUsage) * (staticData?.totalMemoryGB ?? 16) / 100).toFixed(1)} GB`} />
                        <StatItem label="Committed" value={latestStats.ramCommitted ?? '0.0/0.0 GB'} />
                        <StatItem label="Cached" value={latestStats.ramCached ?? '0.0 GB'} />
                        <StatItem label="Paged pool" value={latestStats.ramPaged ?? '0 MB'} />
                        <StatItem label="Non-paged pool" value={latestStats.ramNonPaged ?? '0 MB'} />
                    </>
                )}
                {activeView === 'STORAGE' && (
                    <>
                        <StatItem label="Active time" value={`${latestStats.storageUsage}%`} />
                        <StatItem label="Average response time" value={latestStats.storageResponseTime ?? '0.0 ms'} />
                        <StatItem label="Read speed" value={latestStats.storageReadSpeed ?? '0 KB/s'} />
                        <StatItem label="Write speed" value={latestStats.storageWriteSpeed ?? '0 KB/s'} />
                        <StatItem label="Capacity" value={`${staticData?.totalStorage ?? 512} GB`} />
                        <StatItem label="Formatted" value={`${staticData?.totalStorage ?? 512} GB`} />
                    </>
                )}
            </div>
          </div>
        </div>
      </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="text-2xl font-light">{value}</span>
        </div>
    );
}

function SelectOption(props: {
  title: string;
  view: View;
  subTitle: string;
  data: number[];
  isActive: boolean;
  onClick: () => void;
}) {
  return (
      <button 
        className={cn(
            "flex w-full h-20 bg-transparent border-none rounded-none px-4 text-left cursor-pointer transition-colors items-center gap-3",
            props.isActive ? "bg-[#4d4d4d] border-l-4 border-accent pl-3" : "hover:bg-[#3d3d3d]"
        )} 
        onClick={props.onClick}
      >
        <div className="flex-1 flex flex-col">
          <div className="font-semibold text-lg leading-tight">{props.title}</div>
          <div className="text-sm text-muted-foreground">{props.subTitle}</div>
        </div>
        <div className="w-20 h-10">
          <Chart selectedView={props.view} data={props.data} maxDataPoints={60} hideGrid />
        </div>
      </button>
  );
}

function useStaticData() {
  const [staticData, setStaticData] = useState<StaticData | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getStaticData();
        console.log("Static data received:", data);
        setStaticData(data);
      } catch (e) {
        console.error("Error fetching static data:", e);
      }
    })();
  }, []);

  return staticData;
}

export default App;