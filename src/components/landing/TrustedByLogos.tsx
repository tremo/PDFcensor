const logos = [
  // Finance
  { name: "JPMorgan" },
  { name: "Goldman Sachs" },
  { name: "HSBC" },
  { name: "Deutsche Bank" },
  // Legal
  { name: "Baker McKenzie" },
  { name: "DLA Piper" },
  { name: "Clifford Chance" },
  { name: "Freshfields" },
  // Hospitality
  { name: "Marriott" },
  { name: "Hilton" },
  { name: "Accor" },
  { name: "IHG" },
  // Healthcare
  { name: "Mayo Clinic" },
  { name: "NHS" },
  { name: "Pfizer" },
  { name: "Roche" },
];

export function TrustedByLogos({ title }: { title: string }) {
  return (
    <section className="py-10 border-b border-border bg-muted/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <p className="text-center text-muted-foreground text-xs uppercase tracking-widest font-medium mb-8">
          {title}
        </p>
        <div className="relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-muted/20 to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-muted/20 to-transparent z-10" />
          <div className="flex animate-marquee-slow gap-12 items-center">
            {[...logos, ...logos].map(({ name }, i) => (
              <span
                key={`${name}-${i}`}
                className="text-base font-semibold text-muted-foreground/40 hover:text-foreground/70 transition-colors duration-300 whitespace-nowrap select-none shrink-0"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
