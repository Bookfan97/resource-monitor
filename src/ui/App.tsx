import { useEffect } from "react";
import "./App.css";
import {pollResources} from "../resourceManager.ts";

function App() {
  useEffect(() => {
    return pollResources()
  }, []);

  return (
    <main className="container">

    </main>
  );
}

export default App;
