import type { AdArtworkCopy, AdCategory, AdStyle, PublishTarget } from "@/lib/types";
import {
  categoryLabels,
  publishLabels,
  styleLabels,
} from "@/lib/ad-styles";

const BASE_PROMPT = `Crie uma arte publicitária profissional e de alta conversão utilizando a imagem anexada como produto principal.
Analise o produto na foto e crie o layout visual (cenário, iluminação, composição).
Remova completamente o fundo original e insira o produto em um cenário sofisticado, moderno e relacionado ao seu uso. Utilize iluminação profissional de estúdio, sombras naturais, reflexos realistas, profundidade de campo e acabamento fotográfico comercial.
O produto deve permanecer fiel à imagem original, preservando formato, embalagem, rótulo, logotipo, cores, proporções e detalhes. Não altere textos, nomes ou informações presentes no produto.
Aplique princípios profissionais de direção de arte, psicologia das cores, contraste, hierarquia visual e design de conversão. A aparência deve ser premium, realista e semelhante a uma campanha criada por uma agência especializada em anúncios de performance.
Evite excesso de informações, textos pequenos, elementos genéricos, aparência artificial e estética amadora.
Mantenha todas as informações importantes dentro da área segura, evitando textos próximos às bordas.`;

export function buildAdArtPrompt(input: {
  copy: AdArtworkCopy;
  adCategory: AdCategory;
  adStyle: AdStyle;
  publishTarget: PublishTarget;
  aspectRatio: "4:5" | "9:16";
}): string {
  const formatInstructions =
    input.aspectRatio === "9:16"
      ? "Formato vertical 1080x1920, proporção 9:16, otimizado para Stories do Instagram."
      : "Formato vertical 1080x1350, proporção 4:5, otimizado para anúncios no feed do Instagram e Facebook.";

  const { copy } = input;

  return `${BASE_PROMPT}

Contexto visual:
- Categoria: ${categoryLabels[input.adCategory]}
- Estilo visual: ${styleLabels[input.adStyle]}
- Canal: ${publishLabels[input.publishTarget]}
- ${formatInstructions}

=== TEXTOS OBRIGATÓRIOS (CRÍTICO) ===
Você DEVE renderizar na arte EXATAMENTE os textos abaixo, caractere por caractere, sem alterar uma letra:

HEADLINE (texto grande no topo):
"${copy.headline}"

SUBHEADLINE (texto médio abaixo da headline):
"${copy.subheadline}"

BENEFÍCIOS (lista com bullets, 3 itens):
1. "${copy.benefits[0]}"
2. "${copy.benefits[1]}"
3. "${copy.benefits[2]}"

CTA (texto dentro do botão de ação):
"${copy.cta}"

REGRAS DE TEXTO — OBRIGATÓRIO:
- Idioma: APENAS português do Brasil (PT-BR)
- PROIBIDO: inglês, espanhol, palavras inventadas, erros de ortografia, traduções
- NÃO crie, NÃO traduza, NÃO reformule, NÃO abrevie os textos acima
- Use tipografia sans-serif legível em celular, com bom contraste
- Se não conseguir renderizar texto perfeito, priorize copiar exatamente as frases acima`;
}
