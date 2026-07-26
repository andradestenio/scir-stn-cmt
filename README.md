# SCIR — NIR CEMETRON

Versão preparada para publicação na Vercel com base PostgreSQL no Supabase. O navegador mantém apenas uma cópia de segurança; a fonte principal passa a ser a nuvem.

## Atualização de uma versão já publicada

Substitua no GitHub os arquivos antigos por todos os arquivos desta versão, preservando as pastas `api`, `lib` e `supabase`. As variáveis já cadastradas na Vercel não precisam ser cadastradas novamente. Após o envio ao GitHub, aguarde o deploy automático ou faça **Deployments → Redeploy**.

Esta versão inclui os botões **Exportar backup** e **Importar backup** no Dashboard. O arquivo JSON gerado pelo migrador local pode ser selecionado em **Importar backup** para substituir a base vazia e enviá-la ao Supabase.

### Versão 1.2 — celular e tablet

- Menu lateral recolhível com fundo de proteção e fechamento automático ao navegar.
- Formulários e botões com áreas de toque ampliadas.
- Reorganização de painéis, indicadores e ações para telas estreitas.
- Tabelas com rolagem horizontal por toque.
- Calendário mensal convertido automaticamente em agenda no celular.
- Compatibilidade com áreas seguras de iPhone/iPad e prevenção de zoom involuntário em campos.

### Versão 1.3 — identidade institucional e login

- Nova página de login institucional, responsiva e com melhor hierarquia visual.
- Logo oficial do CEMETRON no login, menu lateral e cabeçalho móvel.
- Opção para mostrar ou ocultar a senha.
- Mensagens de autenticação acessíveis e indicação visual durante a entrada.

### Versão 1.4 — produtividade no plantão

- Bloco de notas na Dashboard, sincronizado com a base integrada.
- Cadastro de mensagens padrão com ações de copiar, editar e excluir.
- Lembrete de registro do ponto de entrada ao iniciar um novo plantão.
- Lembrete de registro do ponto de saída ao encerrar o plantão.

### Versão 1.5 — notificações do Zimbra

- Sino de notificações com contador no computador, tablet e celular.
- Alerta visual no formato “Novo e-mail recebido”, com remetente, assunto e horário.
- Histórico recente de e-mails no Dashboard e no centro de notificações.
- Atualização automática a cada 10 segundos enquanto o SCIR está aberto.
- Deduplicação automática por mensagem.
- Armazenamento mínimo: nenhum corpo de e-mail ou anexo é enviado ao SCIR.

### Versão 1.6 — configuração simplificada

- Consulta direta ao Zimbra pelas funções da Vercel.
- Não depende de Docker, computador ligado, Terminal ou monitor externo.
- Servidor e usuário do e-mail já configurados.
- Tela interna “Configurar e-mail”: basta informar a senha uma única vez.
- Teste da conexão antes da ativação.
- Senha protegida com AES-256-GCM e nunca devolvida ao navegador.
- Usa a tabela `app_state` já existente; não exige nova migração do Supabase.

## 1. Criar a base no Supabase

1. Crie um projeto em https://supabase.com.
2. Abra **SQL Editor**, cole o conteúdo de `supabase/schema.sql` e clique em **Run**.
3. Em **Project Settings → API Keys**, copie:
   - Project URL;
   - a **Secret key**, iniciada por `sb_secret_`. Se o projeto mostrar apenas chaves antigas, use a chave `service_role`. Não use `anon` nem `publishable`.

## 2. Publicar no GitHub

Crie um repositório vazio e envie **todo o conteúdo desta pasta**, mantendo as pastas `api`, `lib` e `supabase`.

## 3. Publicar na Vercel

1. Na Vercel, clique em **Add New → Project** e importe o repositório.
2. Em **Framework Preset**, escolha **Other**.
3. Não preencha Build Command nem Output Directory.
4. Em **Environment Variables**, cadastre:

| Variável | Valor |
| --- | --- |
| `SUPABASE_URL` | Project URL do Supabase |
| `SUPABASE_SECRET_KEY` | Secret key `sb_secret_...` do Supabase |
| `ADMIN_USERNAME` | Seu usuário de acesso |
| `ADMIN_PASSWORD` | Uma senha forte |
| `SESSION_SECRET` | Texto aleatório com pelo menos 32 caracteres |

5. Clique em **Deploy**.

Para gerar `SESSION_SECRET`, use um gerenciador de senhas ou execute
localmente: `openssl rand -hex 32`.

## 4. Ativar as notificações do Zimbra

1. Publique os arquivos atualizados na Vercel.
2. Acesse o SCIR normalmente.
3. No Dashboard, clique em **Configurar e-mail**.
4. Informe a senha do e-mail `nr.cemetron@sesau.ro.gov.br`.
5. Clique em **Testar e ativar**.

O SCIR testará o acesso a `webmail.sesau.ro.gov.br` pela porta IMAP segura 993.
Se a conexão for aceita, as notificações serão ativadas imediatamente. Nenhuma
edição de código, SQL, variável da Vercel ou serviço adicional é necessária.

## Migração dos dados atuais

Se a nova versão substituir um site já publicado **no mesmo domínio**, abra-a primeiro no navegador que contém os dados antigos. Após o login, se a base estiver vazia, o sistema envia automaticamente a cópia local existente ao Supabase.

Se o sistema anterior era aberto como arquivo HTML no computador ou estava em outro domínio, o navegador não permite que o novo site leia diretamente aqueles dados. Nesse caso, obtenha o JSON da base antiga e use **Importar backup**. A chave usada pela versão anterior é `nirCemetronFinalStateV2`. No Chrome, ela pode ser consultada em Ferramentas do desenvolvedor → Application → Local Storage. Guarde uma cópia antes de qualquer migração.

Depois da primeira migração, todos os dispositivos autenticados passam a compartilhar a mesma base. O botão **Exportar backup** gera uma cópia JSON para segurança ou transferência manual.

## Segurança

- A chave privilegiada do Supabase fica somente nas funções da Vercel e nunca é enviada ao navegador.
- O acesso usa cookie seguro, HttpOnly e validade de 12 horas.
- A tabela não permite acesso direto pelas chaves públicas do Supabase.
- A senha do Zimbra é criptografada com AES-256-GCM usando uma chave derivada
  do `SESSION_SECRET` já configurado na Vercel.
- A senha nunca é incluída no pacote, no GitHub ou nas respostas enviadas ao navegador.
- Corpo e anexos do e-mail não são processados.
- Não publique arquivos `.env` nem coloque senhas diretamente no código.

## Backup

O Supabase mantém os dados em PostgreSQL. Para uma cópia adicional, use os relatórios e exportações do próprio SCIR e habilite os backups disponíveis no plano escolhido do Supabase.
