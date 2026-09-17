/** Chave de localStorage compartilhada com o script inline em __root.tsx
 * (que precisa aplicar a classe .dark antes da hidratação, para não piscar
 * o tema errado). Mantenha os dois em sincronia se mudar aqui. */
export const THEME_STORAGE_KEY = "gelo-theme";

export function setStoredTheme(dark: boolean) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, dark ? "dark" : "light");
  } catch {
    // localStorage indisponível (modo privado etc.) — o tema só não persistirá.
  }
}

/** A string exata é reaplicada, ipsis litteris, no <script> inline de
 * __root.tsx — mudanças aqui não afetam aquele script automaticamente. */
export const THEME_INIT_SCRIPT = `(function(){try{if(localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)})!=="light"){document.documentElement.classList.add("dark")}}catch(e){document.documentElement.classList.add("dark")}})();`;
