import { Helmet } from "react-helmet-async";

const SITE_URL = "https://lega.pt";
const DEFAULT_IMAGE = `${SITE_URL}/logo-hero.png`;
const SITE_NAME = "LEGA";
const TWITTER_HANDLE = "@lega_pt";

interface SEOProps {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "article" | "product";
  noIndex?: boolean;
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
  locale?: string;
  keywords?: string;
}

const SEO = ({
  title,
  description,
  path,
  image = DEFAULT_IMAGE,
  type = "website",
  noIndex = false,
  jsonLd,
  locale = "pt_PT",
  keywords,
}: SEOProps) => {
  const url = `${SITE_URL}${path}`;
  const structured = jsonLd
    ? Array.isArray(jsonLd)
      ? jsonLd
      : [jsonLd]
    : [];
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta
        name="robots"
        content={noIndex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"}
      />
      <meta name="googlebot" content={noIndex ? "noindex, nofollow" : "index, follow"} />
      <link rel="canonical" href={url} />
      <link rel="alternate" href={url} hrefLang="pt-PT" />
      <link rel="alternate" href={url} hrefLang="x-default" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content={locale} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={image} />
      <meta property="og:image:alt" content={title} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={TWITTER_HANDLE} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      {structured.map((data, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(data)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEO;