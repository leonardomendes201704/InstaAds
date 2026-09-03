import type { Metadata } from "next";
import { LegalDocumentLayout } from "@/components/legal/LegalDocumentLayout";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Termos de Serviço — InstaAds",
  description: "Termos e condições de uso do InstaAds.",
};

export default function TermsOfServicePage() {
  return (
    <LegalDocumentLayout title="Termos de Serviço">
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">1. Aceitação dos termos</h2>
        <p>
          Ao acessar ou usar o <strong>{siteConfig.name}</strong> (
          {siteConfig.url}), você concorda com estes Termos de Serviço e com a
          nossa{" "}
          <a href="/privacidade" className="text-accent-purple hover:underline">
            Política de Privacidade
          </a>
          . Se não concordar, não utilize o serviço.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">2. Descrição do serviço</h2>
        <p>
          O InstaAds permite que usuários autenticados enviem fotos de produtos
          e recebam artes publicitárias geradas por inteligência artificial para
          uso em Instagram (Feed e/ou Stories). O serviço é fornecido &quot;no
          estado em que se encontra&quot;, sujeito a limitações técnicas e
          disponibilidade dos provedores de IA e infraestrutura.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">3. Conta e elegibilidade</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>É necessário login com conta Google válida.</li>
          <li>Você deve ter pelo menos 18 anos ou capacidade legal para contratar.</li>
          <li>
            Você é responsável pela segurança da sua conta Google e por toda
            atividade realizada após o login.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">4. Uso permitido</h2>
        <p>Você concorda em utilizar o serviço apenas para fins lícitos. É proibido:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Enviar conteúdo ilegal, ofensivo, difamatório ou que viole direitos de terceiros;</li>
          <li>Enviar imagens sem autorização dos titulares de direitos;</li>
          <li>Tentar burlar autenticação, quotas, limites ou medidas de segurança;</li>
          <li>Usar o serviço para spam, fraude ou atividades maliciosas;</li>
          <li>Reengenharia reversa ou exploração abusiva das APIs.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">5. Conteúdo do usuário</h2>
        <p>
          Você mantém a titularidade das fotos e materiais que enviar. Ao usar o
          serviço, você nos concede licença limitada para processar, armazenar e
          exibir esse conteúdo apenas para operar e melhorar o InstaAds.
        </p>
        <p>
          Você declara possuir direitos necessários sobre o material enviado e
          assume responsabilidade por reclamações de terceiros relacionadas ao
          seu conteúdo.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">6. Conteúdo gerado por IA</h2>
        <p>
          As artes e textos são gerados automaticamente por modelos de IA. Podem
          conter imprecisões, erros ortográficos ou elementos visuais
          inadequados. Você deve revisar todo material antes de publicar em
          anúncios reais. Não garantimos resultados comerciais, conversões ou
          conformidade com políticas do Meta/Instagram.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">7. Disponibilidade e alterações</h2>
        <p>
          Podemos modificar, suspender ou descontinuar funcionalidades a
          qualquer momento, inclusive por limites de custo, manutenção ou
          atualizações de provedores externos (Google, Vercel). Faremos esforços
          razoáveis para manter o serviço disponível, sem garantia de uptime
          ininterrupto.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">8. Limitação de responsabilidade</h2>
        <p>
          Na extensão permitida pela lei, o InstaAds e seus operadores não
          serão responsáveis por danos indiretos, lucros cessantes, perda de
          dados ou prejuízos decorrentes do uso ou impossibilidade de uso do
          serviço, incluindo falhas de IA, indisponibilidade ou conteúdo gerado
          incorretamente.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">9. Encerramento</h2>
        <p>
          Podemos suspender ou encerrar seu acesso se houver violação destes
          termos ou risco à segurança do serviço. Você pode deixar de usar o
          serviço a qualquer momento encerrando a sessão e revogando permissões
          OAuth no Google, quando desejar.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">10. Lei aplicável e contato</h2>
        <p>
          Estes termos são regidos pelas leis da República Federativa do Brasil.
          Dúvidas ou notificações:{" "}
          <a
            href={`mailto:${siteConfig.contactEmail}`}
            className="text-accent-purple hover:underline"
          >
            {siteConfig.contactEmail}
          </a>
          .
        </p>
      </section>
    </LegalDocumentLayout>
  );
}
