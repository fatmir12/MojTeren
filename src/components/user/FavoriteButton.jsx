function FavoriteButton({ isFavorite, onToggle, size = "md" }) {
  return (
    <button
      type="button"
      className={`favorite-btn favorite-btn--${size} ${isFavorite ? "favorite-btn--active" : ""}`}
      onClick={(e) => {
        e.stopPropagation()
        onToggle()
      }}
      title={isFavorite ? "Ukloni iz favorita" : "Dodaj u favorite"}
      aria-label={isFavorite ? "Ukloni iz favorita" : "Dodaj u favorite"}
    >
      {isFavorite ? "★" : "☆"}
    </button>
  )
}

export default FavoriteButton
