import "./App.css";
import { Grommet } from "grommet";
const theme = {
  global: {
    font: {
      family: "Roboto",
      size: "18px",
      height: "20px",
    },
  },
};

function App() {
  return (
    <Grommet full theme={theme}>
      <title>React App</title>
    </Grommet>
  );
}

export default App;
