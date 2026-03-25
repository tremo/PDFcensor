import Image from "next/image";

const logos = [
  // Finance
  { name: "JPMorgan", logo: "/logos/jpmorgan.svg" },
  { name: "Goldman Sachs", logo: "/logos/goldman-sachs.svg" },
  { name: "HSBC", logo: "/logos/hsbc.svg" },
  { name: "Deutsche Bank", logo: "/logos/deutsche-bank.svg" },
  // Legal
  { name: "Baker McKenzie", logo: "/logos/baker-mckenzie.svg" },
  { name: "DLA Piper", logo: "/logos/dla-piper.svg" },
  { name: "Clifford Chance", logo: "/logos/clifford-chance.svg" },
  { name: "Freshfields", logo: "/logos/freshfields.svg" },
  // Hospitality
  { name: "Marriott", logo: "/logos/marriott.svg" },
  { name: "Hilton", logo: "/logos/hilton.svg" },
  { name: "Accor", logo: "/logos/accor.svg" },
  { name: "IHG", logo: "/logos/ihg.svg" },
  // Healthcare
  { name: "Mayo Clinic", logo: "/logos/mayo-clinic.svg" },
  { name: "NHS", logo: "/logos/nhs.svg" },
  { name: "Pfizer", logo: "/logos/pfizer.svg" },
  { name: "Roche", logo: "/logos/roche.svg" },
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
            {[...logos, ...logos].map(({ name, logo }, i) => (
              <div
                key={`${name}-${i}`}
                className="flex items-center gap-2.5 shrink-0 opacity-40 hover:opacity-70 transition-opacity duration-300"
              >
                <Image
                  src={logo}
                  alt=""
                  width={28}
                  height={28}
                  className="h-7 w-7 grayscale dark:invert"
                />
                <span className="text-base font-semibold text-muted-foreground whitespace-nowrap select-none">
                  {name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
