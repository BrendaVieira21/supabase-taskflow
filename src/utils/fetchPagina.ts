interface WPPage {
  id: number;
  slug: string;
  title: { rendered: string };
  content: { rendered: string };
}

export async function fetchPagina(slug: string): Promise<WPPage> {
  const res = await fetch(`https://traine.autojun.com.br/wp-json/wp/v2/pages?slug=${slug}&_embed`);
  const data: WPPage[] = await res.json();
  return data[0];
}
