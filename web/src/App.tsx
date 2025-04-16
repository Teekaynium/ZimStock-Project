import { type Component, createSignal } from "solid-js";
import { StockChart } from "./StockChart";
import type { StockData } from "./types";
import openPriceData from "../../archive-single-file/open_price.json";
import closePriceData from "../../archive-single-file/close_price.json";

const App: Component = () => {
  const [data] = createSignal<StockData>(openPriceData);
  const [closeData] = createSignal<StockData>(closePriceData);
  return (
    <div class="container mx-auto">
      <h1 class="text-2xl font-bold mb-4">Zimbabwe Stock Exchange Open Prices</h1>
      <StockChart data={data()} />
      <h1 class="text-2xl font-bold mb-4">Zimbabwe Stock Exchange Close Prices</h1>
      <StockChart data={closeData()} />
    </div>
  );
};

export default App;