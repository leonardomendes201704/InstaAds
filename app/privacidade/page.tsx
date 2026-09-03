import type { Metadata } from "next";
import { LegalDocumentLayout } from "@/components/legal/LegalDocumentLayout";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Política de Privacidade — InstaAds",
  description: "Como o InstaAds coleta, usa e protege seus dados pessoais.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalDocumentLayout title="Política de Privacidade">
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">1. Quem somos</h2>
        <p>
          O <strong>{siteConfig.name}</strong> ({siteConfig.url}) é um serviço
          que permite criar artes publicitárias para Instagram a partir de fotos
          de produtos, utilizando inteligência artificial.
        </p>
        <p>
          Para dúvidas sobre privacidade, entre em contato:{" "}
          <a
            href={`mailto:${siteConfig.contactEmail}`}
            className="text-accent-purple hover:underline"
          >
            {siteConfig.contactEmail}
          </a>
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">2. Dados que coletamos</h2>
        <p>Podemos tratar os seguintes dados quando você usa o serviço:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Dados de autenticação Google:</strong> nome, endereço de
            e-mail, foto de perfil e identificador único da conta (fornecidos
            pelo Google quando você faz login).
          </li>
          <li>
            <strong>Conteúdo enviado por você:</strong> fotos de produtos,
            preferências de estilo, mensagens opcionais e artes geradas.
          </li>
          <li>
            <strong>Dados técnicos:</strong> registros de uso, identificadores
            de sessão, estimativas de consumo de IA e metadados necessários para
            operação, segurança e suporte.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">3. Como usamos seus dados</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Autenticar seu acesso e associar gerações à sua conta.</li>
          <li>Processar imagens e textos para criar anúncios com IA.</li>
          <li>Armazenar suas gerações para histórico e recuperação.</li>
          <li>Melhorar estabilidade, segurança e desempenho do serviço.</li>
          <li>Cumprir obrigações legais e responder a solicitações válidas.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">4. Base legal (LGPD)</h2>
        <p>
          Tratamos dados pessoais com base na execução do contrato (prestação do
          serviço), no legítimo interesse (segurança e melhoria do produto) e,
          quando aplicável, no consentimento — por exemplo, ao conectar sua conta
          Google e enviar conteúdo para geração.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">5. Compartilhamento com terceiros</h2>
        <p>Podemos compartilhar dados com provedores essenciais ao serviço:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Google</strong> — login OAuth e APIs de inteligência
            artificial (Gemini) para geração de textos e imagens.
          </li>
          <li>
            <strong>Vercel</strong> — hospedagem da aplicação e armazenamento
            de arquivos (Vercel Blob).
          </li>
        </ul>
        <p>
          Esses parceiros processam dados conforme suas próprias políticas e
          contratos aplicáveis. Não vendemos seus dados pessoais.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">6. Retenção e armazenamento</h2>
        <p>
          Mantemos suas gerações e metadados enquanto forem necessários para
          fornecer o serviço, cumprir obrigações legais ou resolver disputas.
          Você pode solicitar informações ou exclusão conforme a seção 7.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">7. Seus direitos</h2>
        <p>
          Nos termos da Lei Geral de Proteção de Dados (LGPD), você pode
          solicitar:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Confirmação e acesso aos dados tratados;</li>
          <li>Correção de dados incompletos ou desatualizados;</li>
          <li>Anonimização, bloqueio ou eliminação de dados desnecessários;</li>
          <li>Portabilidade, quando aplicável;</li>
          <li>Revogação de consentimento e informações sobre compartilhamento.</li>
        </ul>
        <p>
          Envie solicitações para{" "}
          <a
            href={`mailto:${siteConfig.contactEmail}`}
            className="text-accent-purple hover:underline"
          >
            {siteConfig.contactEmail}
          </a>
          .
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">8. Segurança</h2>
        <p>
          Adotamos medidas técnicas e organizacionais razoáveis para proteger
          seus dados, incluindo autenticação, armazenamento privado e acesso
          restrito a áreas administrativas. Nenhum sistema é 100% seguro; use o
          serviço com senha forte na conta Google e mantenha seu dispositivo
          protegido.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">9. Menores de idade</h2>
        <p>
          O serviço não é direcionado a menores de 18 anos. Se identificarmos
          coleta indevida de dados de menores, tomaremos medidas para excluí-los.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">10. Alterações desta política</h2>
        <p>
          Podemos atualizar esta Política de Privacidade periodicamente. A data
          da última revisão será indicada no topo da página. O uso continuado após
          alterações constitui ciência das novas condições.
        </p>
      </section>
    </LegalDocumentLayout>
  );
}
