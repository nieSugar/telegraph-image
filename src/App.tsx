import "./App.css";
import { Grommet, FileInput } from "grommet";
import CloudFlare from "cloudflare";

const client = new CloudFlare({
  apiToken: import.meta.env.CLOUDFLARE_API_TOKEN,
});

const theme = {
  global: {
    font: {
      family: "Roboto",
      size: "18px",
      height: "20px",
    },
  },
};

const fileChange = (
  _event: React.ChangeEvent<HTMLInputElement>,
  { files }: { files: File[] }
) => {
  console.log(files, "files");
};

const fileInputMessage = {
  browse: "点击",
  dropPrompt: "拖拽文件到此处或",
  dropPromptLight: "拖拽文件到此处",
};

function App() {
  return (
    <Grommet full theme={theme}>
      <FileInput messages={fileInputMessage} onChange={fileChange}></FileInput>
    </Grommet>
  );
}

export default App;
