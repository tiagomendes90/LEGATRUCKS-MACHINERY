import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import PageHero from "@/components/PageHero";

const Terms = () => {
  const { t } = useTranslation();

  const sections = t("legal.terms.sections", { returnObjects: true }) as Array<{
    title: string;
    body: string;
  }>;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <PageHero title={t("legal.terms.title")} subtitle={t("legal.terms.intro")} />
      <main className="flex-1 container mx-auto max-w-4xl px-6 py-16">
        <div className="space-y-8">
          {Array.isArray(sections) &&
            sections.map((s, i) => (
              <section key={i}>
                <h2 className="text-2xl font-semibold text-foreground mb-2">
                  {s.title}
                </h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {s.body}
                </p>
              </section>
            ))}
        </div>
      </main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
};

export default Terms;