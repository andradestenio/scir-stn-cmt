# SCIR — NIR CEMETRON

Versão preparada para publicação na Vercel com base PostgreSQL no Supabase. O navegador mantém apenas uma cópia de segurança; a fonte principal passa a ser a nuvem.

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

Para gerar `SESSION_SECRET`, use um gerenciador de senhas ou execute localmente: `openssl rand -hex 32`.

## Migração dos dados atuais

Se a nova versão substituir um site já publicado **no mesmo domínio**, abra-a primeiro no navegador que contém os dados antigos. Após o login, se a base estiver vazia, o sistema envia automaticamente a cópia local existente ao Supabase.

Se o sistema anterior era aberto como arquivo HTML no computador ou estava em outro domínio, o navegador não permite que o novo site leia diretamente aqueles dados. Nesse caso, obtenha o JSON da base antiga e use **Importar backup**. A chave usada pela versão anterior é `nirCemetronFinalStateV2`. No Chrome, ela pode ser consultada em Ferramentas do desenvolvedor → Application → Local Storage. Guarde uma cópia antes de qualquer migração.

Depois da primeira migração, todos os dispositivos autenticados passam a compartilhar a mesma base. O botão **Exportar backup** gera uma cópia JSON para segurança ou transferência manual.

## Segurança

- A chave privilegiada do Supabase fica somente nas funções da Vercel e nunca é enviada ao navegador.
- O acesso usa cookie seguro, HttpOnly e validade de 12 horas.
- A tabela não permite acesso direto pelas chaves públicas do Supabase.
- Não publique arquivos `.env` nem coloque senhas diretamente no código.

## Backup

O Supabase mantém os dados em PostgreSQL. Para uma cópia adicional, use os relatórios e exportações do próprio SCIR e habilite os backups disponíveis no plano escolhido do Supabase.
