import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";

export default function AcervoLayout({ children }: LayoutProps<"/acervo">) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 pt-12 pb-24 md:px-8 md:pt-16">{children}</main>
      <SiteFooter />
    </>
  );
}
