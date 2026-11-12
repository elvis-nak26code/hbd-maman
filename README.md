# Joyeux anniversaire, Maman ❤️

Un petit site d'anniversaire animé : une enveloppe scellée qui s'ouvre, une lettre
qui se dévoile, des pétales dorés et une musique de boîte à musique.

## Lancer le site

```bash
npm install
npm run dev
```

Le site s'ouvre tout seul sur http://localhost:5173

Pour la version finale :

```bash
npm run build     # crée le dossier dist/
npm run preview   # teste la version finale
```

## Personnaliser

| Quoi | Où |
| --- | --- |
| Le texte de la lettre | `src/data/letter.js` (le `**gras**` est automatique) |
| Le prénom / surnom | `src/config.js` (`MAMAN`) |
| La musique | voir ci-dessous |
| Les couleurs | `src/styles/global.css` (variables `:root`) |

## La musique

Le site utilise par défaut **`public/musique.mp3`** : une boucle de boîte à
musique de 30 secondes, douce et sans coupure (aucun droit d'auteur). C'est un
vrai fichier audio, donc beaucoup plus fiable et plus léger pour le processeur
d'un téléphone que la synthèse en direct.

> Les navigateurs interdisent le son 100 % automatique. La musique démarre donc
> **au premier clic / toucher** sur la page — et en particulier **au moment où
> l'on touche l'enveloppe**, pour que le son et la lettre s'ouvrent ensemble.
> Un bouton en bas à droite permet de la couper ou de la remettre.

Le site tente quand même un démarrage automatique au chargement. S'il est refusé,
il réessaie à **chaque** geste (toucher, clic, clavier) jusqu'à ce que ça marche,
et une pastille « Activer la musique » s'affiche à côté du bouton pour te le signaler.

Si le fichier MP3 est absent (mauvais chemin après hébergement), le site bascule
tout seul sur une boîte à musique générée dans le navigateur (Web Audio).
Pour revenir à cette version générée, mets `MUSIC_SRC = ''` dans `src/config.js`.

### Sur téléphone, je n'entends rien ?

1. **Les navigateurs mobiles exigent un toucher** avant de jouer du son : touche
   l'enveloppe (ou n'importe où sur la page), c'est ce geste qui lance la musique.
2. Vérifie le **volume des médias** du téléphone.
3. Sur iPhone, le **petit interrupteur silencieux** sur le côté coupe aussi le son
   des pages web : désactive-le.
4. Si tu as mis ta propre chanson et qu'elle ne charge pas (mauvais chemin après
   l'hébergement), le site bascule tout seul sur la boîte à musique intégrée.

### Mettre ta propre chanson

1. Dépose le fichier dans un dossier `public/`, par exemple `public/notre-chanson.mp3`.
2. Ouvre `src/config.js` et écris :

```js
export const MUSIC_SRC = '/notre-chanson.mp3'
```

Elle se lancera au premier geste, en boucle, avec le même bouton de contrôle.

## Structure

```
src/
  App.jsx                  # enchaînement enveloppe → lettre
  config.js                # prénom + musique
  data/letter.js           # le message
  components/
    EnvelopeScene.jsx      # enveloppe 3D + sceau de cire
    LetterScene.jsx        # la lettre, les cœurs, les boutons
    MusicToggle.jsx        # bouton musique flottant
    Petals.jsx             # canvas de pétales / cœurs / poussière d'or
  hooks/useMusic.js        # démarrage auto + au premier geste
  lib/music.js             # lecture du MP3 + secours Web Audio
  styles/global.css        # toute la direction artistique

public/
  musique.mp3              # la boucle de boîte à musique (30 s)
```

Bon anniversaire à ta maman. ❤️
