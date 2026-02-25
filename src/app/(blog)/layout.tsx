import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Script from "next/script";
import { loadSiteSettings } from "@/lib/settings";
import { getCategories } from "@/lib/supabase/queries";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await loadSiteSettings();
  const siteName =
    typeof settings.site_name === "string" && settings.site_name
      ? settings.site_name
      : process.env.NEXT_PUBLIC_SITE_NAME ?? "Blogwise";
  const siteDescription =
    typeof settings.site_description === "string" && settings.site_description
      ? settings.site_description
      : process.env.NEXT_PUBLIC_SITE_DESCRIPTION ?? "AI 기반 자동 블로그 시스템";

  return {
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
    description: siteDescription,
  };
}

export default async function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Resolve AdSense settings: env vars take priority, then DB settings
  const [settings, categories] = await Promise.all([
    loadSiteSettings(),
    getCategories(),
  ]);

  const adsenseEnabled =
    process.env.NEXT_PUBLIC_ADSENSE_ENABLED === "true" ||
    settings.adsense_enabled === true;

  const adsenseClientId =
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID ??
    (typeof settings.adsense_publisher_id === "string" && settings.adsense_publisher_id
      ? settings.adsense_publisher_id
      : undefined);

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
      <Header categories={categories} />
      <main className="min-h-screen bg-background">
        {children}
      </main>
      <Footer />
    </>
  );
}
