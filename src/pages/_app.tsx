import type { AppProps } from 'next/app';
import { Grommet } from "grommet";
import { grommet } from "grommet/themes";
import { deepMerge } from "grommet/utils";
import "../index.css";

// 认证相关
import { AuthProvider } from "../contexts/AuthContext";

// Grommet主题
const theme = deepMerge(grommet, {
  global: {
    font: {
      family: "Roboto",
      size: "18px",
      height: "20px",
    },
  },
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Grommet full theme={theme} themeMode="dark">
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </Grommet>
  );
}
