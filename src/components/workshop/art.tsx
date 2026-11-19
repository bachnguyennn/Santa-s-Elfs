import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * The Workshop's painted rooms (supplied art, design/workshop-moodboard/art → public/art).
 * Every room is 1672×941 and shipped at 640/1024/1672 px WebP. Images are decorative: the page's
 * headings, links, statuses and fields are always real HTML laid over or beside them.
 */
export type ArtName = "workshop-plate" | "village-street" | "workshop-threshold" | "writing-desk" | "post-office" | "gift-house";

export const ART_W = 1672;
export const ART_H = 941;

export function artSrcSet(name: ArtName) {
  return `/art/${name}-640.webp 640w, /art/${name}-1024.webp 1024w, /art/${name}-1672.webp 1672w`;
}

/** A painted room as a plain <img> with explicit dimensions (no layout shift, no image service). */
export function ArtImage({
  name,
  sizes = "100vw",
  priority = false,
  position,
  className,
  style,
}: {
  name: ArtName;
  sizes?: string;
  /** The first scene of a page: loaded eagerly at high priority. Everything else loads lazily. */
  priority?: boolean;
  /** object-position for cropped uses, e.g. "70% 40%". */
  position?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static pre-sized WebP set; no runtime image service needed
    <img
      src={`/art/${name}-1024.webp`}
      srcSet={artSrcSet(name)}
      sizes={sizes}
      width={ART_W}
      height={ART_H}
      alt=""
      aria-hidden
      decoding="async"
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      draggable={false}
      className={cn("select-none", className)}
      style={{ objectPosition: position, ...style }}
    />
  );
}

/**
 * A shallow crop of a room above a page's content: the setting, never the content.
 * Content below sits on opaque paper (SPEC: administrative pages use a shallow crop).
 */
export function SceneBanner({
  name,
  position = "50% 50%",
  className,
  priority = true,
  children,
}: {
  name: ArtName;
  position?: string;
  className?: string;
  priority?: boolean;
  /** Overlaid HTML (headings) placed on a scrim at the banner's bottom. */
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("relative h-[clamp(9rem,24vw,17rem)] overflow-hidden bg-oxblood", className)}>
      <ArtImage name={name} priority={priority} position={position} className="absolute inset-0 size-full object-cover" />
      {children && (
        <>
          <div aria-hidden className="absolute inset-0 bg-[linear-gradient(to_top,rgb(44_8_16/0.92),rgb(44_8_16/0.6)_55%,rgb(44_8_16/0.3))] sm:bg-[linear-gradient(to_top,rgb(44_8_16/0.88),rgb(44_8_16/0.4)_50%,transparent_80%)]" />
          <div className="on-dark relative mx-auto flex h-full max-w-6xl items-end px-4 pb-5 text-buttercream sm:px-8 sm:pb-7">{children}</div>
        </>
      )}
    </div>
  );
}

/** The painted elf (transparent), for small moments: empty states, a created group, the draw. Decorative. */
export function ElfFigure({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- pre-sized transparent WebP layer
    <img
      src="/art/ribbon-elf-320.webp"
      srcSet="/art/ribbon-elf-320.webp 320w, /art/ribbon-elf-640.webp 640w"
      sizes="160px"
      width={1312}
      height={1199}
      alt=""
      aria-hidden
      loading="lazy"
      draggable={false}
      className={cn("h-auto w-32 select-none", className)}
    />
  );
}
