export function SectionHeading({
  eyebrow,
  title,
  intro,
  as: Tag = "h2",
  align = "left",
  className = "",
  id,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  intro?: React.ReactNode;
  as?: "h1" | "h2";
  align?: "left" | "center";
  className?: string;
  id?: string;
}) {
  return (
    <div className={`${align === "center" ? "mx-auto text-center" : ""} max-w-3xl ${className}`}>
      {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
      <Tag id={id} className="display text-[2.6rem] sm:text-6xl lg:text-7xl">
        {title}
      </Tag>
      {intro && <div className="mt-5 max-w-2xl text-lg text-stone [.on-dark_&]:text-mist">{intro}</div>}
    </div>
  );
}

/** Top-of-page introduction for interior pages (clears the fixed header). */
export function PageIntro({ eyebrow, title, intro, children }: { eyebrow?: string; title: React.ReactNode; intro?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <section className="border-b border-line bg-bone pb-12 pt-32 lg:pb-16 lg:pt-40">
      <div className="container-site">
        <SectionHeading as="h1" eyebrow={eyebrow} title={title} intro={intro} className="max-w-4xl" />
        {children}
      </div>
    </section>
  );
}
