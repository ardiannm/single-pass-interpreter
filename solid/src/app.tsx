import styles from "./styles/app.module.scss";

import type { Component } from "solid-js";
import Input from "./components/screen";

const App: Component = () => {
  return (
    <div class={styles.app}>
      <Input />
    </div>
  );
};

export default App;