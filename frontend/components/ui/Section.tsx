import { cn } from "@/lib/utils";

export function Section({
  tone = "dark",
  className,
  children,
  innerClassName,
}: {
  tone?: "dark" | "light";
  className?: string;
  children: React.ReactNode;
  innerClassName?: string;
}) {
  return (
    <section
      className={cn(
        "w-full px-6 lg:px-10 py-12 lg:py-16",
        tone === "dark" ? "section-dark" : "section-light",
        className
      )}
    >
      <div className={cn("max-w-[1500px] mx-auto", innerClassName)}>
        {children}
      </div>
    </section>
  );
}

export function SectionHero({
  eyebrow,
  title,
  description,
  align = "left",
  tone = "dark",
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  tone?: "dark" | "light";
}) {
  return (
    <div
      className={cn(
        "mb-10",
        align === "center" ? "text-center mx-auto max-w-3xl" : "max-w-3xl"
      )}
    >
      {eyebrow && (
        <div
          className={cn(
            "inline-flex",
            tone === "dark"
              ? "section-eyebrow-dark"
              : "section-eyebrow-light"
          )}
        >
          {eyebrow}
        </div>
      )}
      <h2
        className={cn(
          "mt-3 text-2xl lg:text-4xl font-bold tracking-tight text-balance",
          tone === "dark" ? "text-white" : "text-slate-900"
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "mt-3 text-sm lg:text-base leading-relaxed text-balance",
            tone === "dark" ? "text-slate-300" : "text-slate-600"
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
