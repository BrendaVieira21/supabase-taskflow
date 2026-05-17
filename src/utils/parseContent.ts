export function parseContent(htmlString: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");
  return {
    titulos: Array.from(doc.querySelectorAll("h1, h2, h3, h4")),
    paragrafos: Array.from(doc.querySelectorAll("p")),
    imagens: Array.from(doc.querySelectorAll("img")),
    listas: Array.from(doc.querySelectorAll("ul, ol")),
  };
}
