import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Script from "next/script";

const adsenseEnabled = process.env.NEXT_PUBLIC_ADSENSE_ENABLED === "true";
const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {adsenseEnabled && adsenseClientId && (
        <>
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
          <Script id="adsense-auto-ads" strategy="afterInteractive">
            {`
              try {
                (adsbygoogle = window.adsbygoogle || []).push({
                  google_ad_client: "${adsenseClientId}",
                  enable_page_level_ads: true
                });
              } catch (e) {
                console.error('AdSense initialization error:', e);
              }
            `}
          </Script>
        </>
      )}
      <Header />
      <main className="min-h-screen bg-background">
        {children}
      </main>
      <Footer />
    </>
  );
}
