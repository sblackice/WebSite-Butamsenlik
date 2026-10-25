import { toggleFavorite } from "@/app/actions/favorites";
import { Icon } from "./Icon";

export function FavoriteButton({
  productId,
  active,
  back,
  className = "",
  withText = false,
}: {
  productId: string;
  active: boolean;
  back: string;
  className?: string;
  withText?: boolean;
}) {
  return (
    <form action={toggleFavorite} className={className}>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="back" value={back} />
      <button
        type="submit"
        aria-pressed={active}
        aria-label={active ? "Favorilerden çıkar" : "Favorilere ekle"}
        className={withText ? "btn btn-outline" : "grid h-10 w-10 place-items-center rounded-full bg-paper/90 text-ink shadow-sm hover:bg-paper"}
      >
        <span className={active ? "text-danger [&_path]:fill-current" : ""}>
          <Icon name="heart" size={20} />
        </span>
        {withText && (active ? "Favorilerde" : "Favorilere ekle")}
      </button>
    </form>
  );
}
