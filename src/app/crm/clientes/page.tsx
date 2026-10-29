import { ResourceView } from "@/components/resource-view";

export default function Page() {
  return (
    <ResourceView
      resourceKey="clientes"
      capitulo="02 · O vínculo é o caminho"
      linkBase="/crm/clientes/"
      descricao="Clique no nome do cliente para abrir a ficha completa: contratos, cobranças, onboarding, interações e chamados."
    />
  );
}
