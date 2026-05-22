import { useEffect, useMemo, useState } from 'react';
import './App.css';
import { useStatistics } from './useStatistics';
import { Chart } from './Chart';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { getStaticData } from '../resourceManager';
import { listen } from '@tauri-apps/api/event';

function App() {
  const staticData = useStaticData();
  const statistics = useStatistics(10);
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

  return (
      <div className="App">
        <Header />
        <div className="main">
          <div>
            <SelectOption
                onClick={() => setActiveView('CPU')}
                title="CPU"
                view="CPU"
                subTitle={staticData?.cpuModel ?? ''}
                data={cpuUsages}
            />
            <SelectOption
                onClick={() => setActiveView('RAM')}
                title="RAM"
                view="RAM"
                subTitle={(staticData?.totalMemoryGB.toString() ?? '') + ' GB'}
                data={ramUsages}
            />
            <SelectOption
                onClick={() => setActiveView('STORAGE')}
                title="STORAGE"
                view="STORAGE"
                subTitle={(staticData?.totalStorage.toString() ?? '') + ' GB'}
                data={storageUsages}
            />
          </div>
          <div className="mainGrid">
            <Chart
                selectedView={activeView}
                data={activeUsages}
                maxDataPoints={10}
            />
          </div>
        </div>
      </div>
  );
}

function SelectOption(props: {
  title: string;
  view: View;
  subTitle: string;
  data: number[];
  onClick: () => void;
}) {
  return (
      <button className="selectOption" onClick={props.onClick}>
        <div className="selectOptionTitle">
          <div>{props.title}</div>
          <div>{props.subTitle}</div>
        </div>
        <div className="selectOptionChart">
          <Chart selectedView={props.view} data={props.data} maxDataPoints={10} hideGrid />
        </div>
      </button>
  );
}

function Header() {
  const appWindow = getCurrentWindow();
  return (
      <header>
        <button
            id="close"
            onClick={() => appWindow.close()}
        />
        <button
            id="minimize"
            onClick={() => appWindow.minimize()}
        />
        <button
            id="maximize"
            onClick={() => appWindow.toggleMaximize()}
        />
      </header>
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