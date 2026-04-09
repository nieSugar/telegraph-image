import Document, { Html, Head, Main, NextScript } from 'next/document';

export default class MyDocument extends Document {

  override render() {
    return (
      <Html lang="zh-CN">
        <Head>
          <meta name="theme-color" content="#0a0a09" />
          <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
          <link rel="icon" href="/favicon.ico" />
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
          <link rel="manifest" href="/site.webmanifest" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=JetBrains+Mono:wght@400;500&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap"
            rel="stylesheet"
          />
          <meta name="description" content="Telegraph Image — Private image hosting with elegance" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
