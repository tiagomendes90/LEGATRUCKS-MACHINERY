import { ReactNode } from "react";

interface PageHeroProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

/**
 * Shared hero/banner for all internal pages.
 * Consistent height, background, typography and spacing across the site.
 * Only title and subtitle vary per page.
 */
const PageHero = ({ title, subtitle, children }: PageHeroProps) => {
  return (
    <section
      className="bg-gradient-to-r from-blue-900 to-slate-800 text-white pt-28 pb-10"
      style={{ minHeight: 220 }}
    >
      <div className="container mx-auto px-6">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-left">
          {title}
        </h1>
        {subtitle && (
          <p className="text-base md:text-lg text-blue-100 max-w-2xl text-left">
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </section>
  );
};

export default PageHero;