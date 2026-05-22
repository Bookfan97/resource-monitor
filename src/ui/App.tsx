import { useEffect, useMemo, useState } from 'react';
import './App.css';
import { useStatistics } from './useStatistics';
import { Chart } from './Chart';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { getStaticData } from '../resourceManager';
import { listen } from '@tauri-apps/api/event';

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
    }
  }, [activeView, cpuUsages, ramUsages, storageUsages]);

  useEffect(() => {
    const unlistenPromise = listen<View>('changeView', (event) => setActiveView(event.payload));
    return () => {
        unlistenPromise.then(unlisten => unlisten());
    };
  }, []);

  const latestStats = statistics[statistics.length - 1] || { cpuUsage: 0, ramUsage: 0, storageUsage: 0 };
  const cpuModelShort = staticData?.cpuModel.split(' @')[0] ?? '';

  return (
      <div className="App">
        <div className="main">
          <div className="sidebar">
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
                subTitle={`${(latestStats.ramUsage * (staticData?.totalMemoryGB ?? 16) / 100).toFixed(1)}/${staticData?.totalMemoryGB ?? 16} GB (${latestStats.ramUsage}%)`}
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
          <div className="mainGrid">
            <div className="viewHeader">
                <h2>{activeView === 'RAM' ? 'Memory' : activeView === 'STORAGE' ? 'Disk 0 (C:)' : activeView}</h2>
                <div style={{ color: '#aaa', fontSize: '1.2em' }}>{activeView === 'CPU' ? cpuModelShort : ''}</div>
            </div>
            <div className="mainChartContainer">
                <div style={{ position: 'absolute', top: 5, right: 10, color: '#aaa', fontSize: '0.8em', zIndex: 10 }}>% Utilization</div>
                <Chart
                    selectedView={activeView}
                    data={activeUsages}
                    maxDataPoints={60}
                />
            </div>
            <div className="statsGrid">
                {activeView === 'CPU' && (
                    <>
                        <StatItem label="Utilization" value={`${latestStats.cpuUsage}%`} />
                        <StatItem label="Speed" value="3.40 GHz" />
                        <StatItem label="Processes" value="245" />
                        <StatItem label="Threads" value="3210" />
                        <StatItem label="Handles" value="124500" />
                        <StatItem label="Up time" value="0:12:45:22" />
                    </>
                )}
                {activeView === 'RAM' && (
                    <>
                        <StatItem label="In use (Compressed)" value={`${(latestStats.ramUsage * (staticData?.totalMemoryGB ?? 16) / 100).toFixed(1)} GB (120 MB)`} />
                        <StatItem label="Available" value={`${((100 - latestStats.ramUsage) * (staticData?.totalMemoryGB ?? 16) / 100).toFixed(1)} GB`} />
                        <StatItem label="Committed" value="18.5/32.0 GB" />
                        <StatItem label="Cached" value="4.2 GB" />
                        <StatItem label="Paged pool" value="640 MB" />
                        <StatItem label="Non-paged pool" value="320 MB" />
                    </>
                )}
                {activeView === 'STORAGE' && (
                    <>
                        <StatItem label="Active time" value={`${latestStats.storageUsage}%`} />
                        <StatItem label="Average response time" value="0.5 ms" />
                        <StatItem label="Read speed" value="0 KB/s" />
                        <StatItem label="Write speed" value="124 KB/s" />
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
        <div className="statItem">
            <span className="statLabel">{label}</span>
            <span className="statValue">{value}</span>
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
      <button className={`selectOption ${props.isActive ? 'active' : ''}`} onClick={props.onClick}>
        <div className="selectOptionTitle">
          <div className="title">{props.title}</div>
          <div className="subtitle">{props.subTitle}</div>
        </div>
        <div className="selectOptionChart">
          <Chart selectedView={props.view} data={props.data} maxDataPoints={60} hideGrid />
        </div>
      </button>
  );
}

function useStaticData() {
  const [staticData, setStaticData] = useState<StaticData | null>(null);

  useEffect(() => {
    (async () => {
      setStaticData(await getStaticData());
    })();
  }, []);

  return staticData;
}

export default App;