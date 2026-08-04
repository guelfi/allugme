# Glossário (compartilhado)

Linguagem neutra para as duas trilhas de implementação. Sem marca de produto.

| Termo | Definição |
|-------|-----------|
| **Plataforma / SaaS** | Sistema multi-tenant que atende várias imobiliárias e corretores independentes |
| **Tenant** | Conta isolada (imobiliária ou corretor independente) |
| **Imobiliária** | Tenant do tipo organização, com um ou mais corretores |
| **Corretor independente** | Tenant de um único profissional (admin do próprio tenant) |
| **SaaS Admin** | Administrador da plataforma (não pertence a um tenant de cliente) |
| **Vitrine** | Site público do tenant onde visitantes buscam imóveis |
| **Painel / Dashboard** | Área autenticada para gestão de imóveis, agenda e usuários |
| **Visitante** | Usuário público (locatário ou comprador em potencial), autenticado ou não |
| **Operação** | Tipo de anúncio: `sale` (venda) ou `rent` (locação) |
| **Visita** | Agendamento para o visitante conhecer o imóvel |
| **Buffer** | Intervalo mínimo entre o fim de uma visita e o início da próxima (padrão 60 min) |
| **Agenda** | Conjunto de visitas, bloqueios e regras de disponibilidade de um corretor |
| **Tema / Modelo / Layout** | Pacote HTML/CSS/JS que define a UI da vitrine |
| **Tema oficial** | Um dos três layouts mantidos pela plataforma |
| **Tema custom** | Layout próprio do tenant (upload + aprovação) — pós-MVP da rinha |
| **RBAC** | Controle de acesso baseado em papéis (roles) e permissões |
| **Trilha A** | Implementação backend .NET + frontend React |
| **Trilha B** | Implementação PHP + HTML/CSS/JS |
| **MVP da rinha** | Escopo mínimo comum para comparar as duas trilhas |
| **Placeholder de tema** | Variável no HTML (ex.: `{{property.title}}`) preenchida pelo backend |
| **Evolution API** | Gateway/API para envio e recebimento de mensagens WhatsApp |
| **Instância Evolution** | Conexão WhatsApp gerenciada pela Evolution API (por tenant ou plataforma) |
| **Notificação de visita** | Mensagem WhatsApp enviada ao corretor/imobiliária quando há solicitação de visita |
| **Confirmação via WhatsApp** | Corretor responde ao aviso (ex.: SIM/NAO + código) e a plataforma atualiza o status da visita |
| **Redis** | Store em memória para cache, fila, locks distribuídos, rate limit e idempotência |
| **Fila WhatsApp** | Jobs de envio enfileirados no Redis e consumidos por worker (desacopla da request HTTP) |
| **Lock de agenda** | Trava de curta duração (Redis) no corretor/slot para evitar double-booking sob concorrência |
