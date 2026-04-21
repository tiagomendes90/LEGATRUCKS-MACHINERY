import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";

const Terms = () => {
  const { t } = useTranslation();

  const sections = t("legal.terms.sections", { returnObjects: true }) as Array<{
    title: string;
    body: string;
  }>;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto max-w-4xl px-6 pt-28 pb-16">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          {t("legal.terms.title")}
        </h1>
        <p className="text-muted-foreground mb-10">
          {t("legal.terms.intro")}
        </p>
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