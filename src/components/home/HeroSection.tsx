
const HeroSection = () => {
  return (
    <section className="relative h-screen w-full overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{
        backgroundImage: `url('/lovable-uploads/5e2912d0-c74c-4979-91b4-a8a43d2ac24b.png')`
      }} />
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative flex items-center justify-center h-full">
        <img
          src="/logo-hero.png"
          alt="LEGA Trucks & Machinery"
          className="w-[64%] md:w-[52%] max-w-2xl object-contain drop-shadow-2xl"
        />
      </div>
    </section>
  );
};

export default HeroSection;
