import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        {children}
      </main>
      <Footer />
    </>
  );
}
