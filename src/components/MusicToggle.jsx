/**
 * Petit bouton flottant pour couper / remettre la musique.
 * Affiche une invitation tant que la musique n'a pas démarré.
 */
export default function MusicToggle({ playing, showHint, onToggle }) {
  return (
    <button
      type="button"
      className={`music-toggle ${playing ? 'is-playing' : ''}`}
      onClick={onToggle}
      aria-label={playing ? 'Couper la musique' : 'Lancer la musique'}
      aria-pressed={playing}
      title={playing ? 'Couper la musique' : 'Lancer la musique'}
    >
      <span className="music-ring" aria-hidden="true" />
      {showHint && <span className="music-label">Activer la musique</span>}
      {playing ? (
        <span className="equalizer" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </span>
      ) : (
        <svg className="music-off" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 18.5A2.5 2.5 0 1 1 6.5 16c.6 0 1.1.2 1.5.5V5.6l9-1.8v9.2a2.5 2.5 0 1 1-1-2V7.3l-7 1.4v9.8z" />
        </svg>
      )}
    </button>
  )
}
