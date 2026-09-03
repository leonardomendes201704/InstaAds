import type { AdCategory, AdStyle, PublishTarget } from "@/lib/types";
import {
  categoryLabels,
  publishLabels,
  styleLabels,
} from "@/lib/ad-styles";

const BASE_PROMPT = `Crie uma arte publicitária profissional e de alta conversão utilizando a imagem anexada como produto principal.
Analise automaticamente o produto, identifique seu nicho, público ideal, principais benefícios e os gatilhos de compra mais adequados. A arte será usada em anúncios no Instagram e Facebook, com o objetivo de despertar desejo, aumentar a percepção de valor e gerar mensagens de potenciais clientes.
Remova completamente o fundo original e insira o produto em um cenário sofisticado, moderno e relacionado ao seu uso. Utilize iluminação profissional de estúdio, sombras naturais, reflexos realistas, profundidade de campo e acabamento fotográfico comercial.
O produto deve permanecer fiel à imagem original, preservando formato, embalagem, rótulo, logotipo, cores, proporções e detalhes. Não altere textos, nomes ou informações presentes no produto.
Crie uma composição visual estratégica com:
Uma headline curta, forte e focada no principal desejo do cliente.
Uma subheadline persuasiva destacando o maior benefício do produto.
De dois a três benefícios curtos e fáceis de ler.
Um CTA chamativo, como: "Chame no WhatsApp", "Envie uma mensagem" ou "Peça o seu agora".
Elementos visuais que transmitam qualidade, confiança e desejo de compra.
Espaço organizado para que todos os textos tenham boa leitura no celular.
Aplique princípios profissionais de direção de arte, psicologia das cores, contraste, hierarquia visual e design de conversão. A aparência deve ser premium, realista e semelhante a uma campanha criada por uma agência especializada em anúncios de performance.
Evite excesso de informações, textos pequenos, elementos genéricos, aparência artificial, erros de português, deformações no produto e estética amadora.
Mantenha todas as informações importantes dentro da área segura, evitando textos próximos às bordas.
Objetivo final: fazer a pessoa parar de rolar o feed, entender rapidamente o valor do produto, sentir vontade de comprar e clicar para enviar uma mensagem.`;

const ctaByCategory: Record<AdCategory, string> = {
  produto: "Envie uma mensagem",
  servico: "Chame no WhatsApp",
  promocao: "Peça o seu agora",
};

export function buildAdArtPrompt(input: {
  mainMessage: string;
  adCategory: AdCategory;
  adStyle: AdStyle;
  publishTarget: PublishTarget;
  aspectRatio: "4:5" | "9:16";
}): string {
  const formatInstructions =
    input.aspectRatio === "9:16"
      ? "Formato vertical 1080x1920, proporção 9:16, otimizado para Stories do Instagram."
      : "Formato vertical 1080x1350, proporção 4:5, otimizado para anúncios no feed do Instagram e Facebook.";

  return `${BASE_PROMPT}

Contexto do anunciante:
- Categoria: ${categoryLabels[input.adCategory]}
- Estilo visual: ${styleLabels[input.adStyle]}
- Canal: ${publishLabels[input.publishTarget]}
- Mensagem principal sugerida: "${input.mainMessage}"
- CTA preferencial: "${ctaByCategory[input.adCategory]}"
- ${formatInstructions}

Use a mensagem principal como base para headline e subheadline. Todos os textos devem estar em português do Brasil.`;
}
