
const HeroSection = () => {
  return (
    <section className="relative h-screen w-full overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{
        backgroundImage: `url('/lovable-uploads/5e2912d0-c74c-4979-91b4-a8a43d2ac24b.png')`
      }} />
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative flex items-center justify-center h-full">
        <div className="logo-wrapper animate-logo-entry">
          <img
            src="/logo-hero.png"
            alt="LEGA Trucks & Machinery"
            className="logo-image w-[64vw] md:w-[52vw] max-w-2xl object-contain drop-shadow-2xl"
          />
          <div className="logo-shine-mask" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
