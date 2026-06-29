import "./globals.css";

export const metadata = {
  title: "AccDoo HRMS",
  description: "AccDoo HRMS foundation",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
