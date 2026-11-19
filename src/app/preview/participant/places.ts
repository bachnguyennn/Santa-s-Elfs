/**
 * Fictional participant walkthrough: Priya in "Maple Street Cousins", names already drawn.
 * `sealed` previews the village before she opens her envelope (no recipient name anywhere).
 */
export function previewPlaces(sealed = false) {
  const q = sealed ? "?sealed=1" : "";
  return [
    { href: `/preview/participant${q}`, label: "Your village" },
    { href: sealed ? "/preview/envelope" : "/preview/envelope?opened=1", label: "Your envelope" },
    { href: `/preview/participant/post-office${q}`, label: "Post Office · Messages" },
    { href: `/preview/participant/gift-house${q}`, label: "Gift House · Wishlist" },
  ];
}

