import Footer from "@/components/Footer";
import Header from "@/components/Header";
import MegaMenu from "@/components/MegaMenu";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <MegaMenu />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
