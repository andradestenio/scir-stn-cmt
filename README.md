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
- Alerta sonoro curto para cada e-mail novo, ativado por padrão.
- Controle no centro de notificações para silenciar ou reativar o som.
- E-mails ainda não tratados recebem tag amarela `Pendente` e destaque amarelo suave.
- `Marcar como lida` altera o cartão para azul e mostra a tag `Lido`.
- Depois disso, `Marcar como respondido` altera o cartão para verde e mostra a tag `Respondido`.
- Os status `Lido` e `Respondido` são sincronizados entre os dispositivos conectados ao SCIR.

### Versão 1.7 — acompanhamento por plantão

- Alerta sonoro mais alto, com três tons, para facilitar a percepção durante o plantão.
- Resumo no Dashboard com a quantidade de e-mails `Pendentes`, `Lidos` e `Respondidos`.
- E-mails respondidos saem da lista em acompanhamento e permanecem disponíveis em **Ver todas → Histórico**.
- O monitoramento do Zimbra começa somente ao iniciar um plantão e atualiza a
  caixa aproximadamente a cada 10 segundos enquanto o SCIR permanece aberto.
- Ao encerrar o plantão, as consultas e os alertas de novos e-mails são interrompidos.
- Ao iniciar o plantão seguinte, o sistema considera apenas os e-mails que chegarem a partir daquele momento.

### Versão 1.7.1 — campo ampliado no SBAR

- O campo **Vagas disponíveis** passou a aceitar texto longo e possui o mesmo
  tamanho dos demais campos descritivos do relatório SBAR.

### Versão 1.7.2 — padronização reforçada do SBAR

- Os quatro campos descritivos do SBAR usam explicitamente a mesma classe,
  quantidade de linhas, altura e possibilidade de redimensionamento.

### Versão 1.8 — histórico de e-mails por plantão

- Cada nova notificação de e-mail é vinculada ao plantão em que foi recebida.
- As contagens, a lista em acompanhamento e **Ver todas → Histórico** exibem
  somente os e-mails do plantão atual, inclusive depois de seu encerramento.
- E-mails pendentes, lidos ou respondidos de plantões anteriores não aparecem
  no plantão seguinte.

### Versão 1.9 — produtividade do plantão

- O relatório do plantão registra os totais de e-mails recebidos, respondidos
  e classificados como `Ciente 👍🏻`.
- `Ciente 👍🏻` é um desfecho final em roxo para mensagens que não exigem
  resposta; após a leitura, pode ser escolhido no lugar de `Respondido`.
- Cada atualização do censo realizada durante o plantão é preservada com data,
  hora, responsável, disponibilidade informada e observações.
- Os indicadores e as atualizações do censo aparecem na tela do relatório, no
  histórico de plantões e nas exportações PDF e Excel.

### Versão 1.10 — edição das ações dos e-mails

- Cada cartão de e-mail possui o campo **Editar ação**, com as opções
  `Pendente`, `Lido`, `Respondido` e `Ciente 👍🏻`.
- Um e-mail respondido ou ciente pode ser corrigido para qualquer outro status.
- Ao retornar para `Pendente` ou `Lido`, o e-mail reaparece automaticamente em
  **Em acompanhamento** e as contagens de produtividade são recalculadas.
- A alteração permanece restrita ao histórico do mesmo plantão e é sincronizada
  entre os dispositivos conectados ao SCIR.

### Versão 1.11.3 — simetria e identificação assistencial

- O status do conector, a última atualização e o botão de atualização possuem
  agora a mesma largura, altura, alinhamento e raio de borda.
- Cada setor recebeu sua tag assistencial: `INFECTO`, `CM` ou `INFECTO/CM`.
- As tags usam cores próprias e permanecem alinhadas ao nome do setor em todas
  as linhas da tabela.

### Versão 1.11.2 — leitura de setores sem pacientes

- Corrigida a consulta de setores como **PA/Observação** quando o Hospub mostra
  somente `Lista de Pacientes - (0)`, sem repetir o nome da clínica no título.
- A mensagem `Nenhum paciente encontrado para a busca` passa a ser reconhecida
  como total zero válido.
- Uma falha isolada deixa de interromper toda a atualização: o conector segue
  para os setores seguintes e sinaliza atualização parcial.
- Setores ainda não lidos agora mostram `Aguardando Hospub`, em vez de zero.
- Os quatro ícones dos indicadores foram centralizados e padronizados em
  proporção e espessura de traço.
- A tabela de ocupação agora possui uma linha final `TOTAL`, com leitos
  operacionais, pacientes internados, leitos disponíveis e taxa consolidada.

### Versão 1.11.1 — correção de ativação do conector Hospub

- O conector agora se ativa automaticamente na página do Hospub ao receber uma
  solicitação do SCIR, sem depender apenas da injeção feita ao atualizar a aba.
- A tela **Consulta por Clínica** também é localizada quando o Hospub a carrega
  dentro de um quadro interno.
- Se houver mais de uma aba do Hospub aberta, o conector prioriza aquela que já
  está exibindo a seleção de clínicas.
- As mensagens de erro agora diferenciam aba ausente, permissão do Chrome e
  extensão desatualizada.

### Versão 1.11 — módulo Ocupação Hospub

- Novo módulo independente **Ocupação Hospub**, sem alterar o censo manual já
  existente na Dashboard.
- O conector do Chrome percorre automaticamente as clínicas do Visual Hospub,
  incluindo todas as opções iniciadas por `PA`.
- As opções `Todas`, `Teste Hospub Clínica` e `XXXXXXX` são desconsideradas.
- Cadastros repetidos que exibem a mesma lista são identificados localmente para
  evitar dupla contagem.
- O módulo correlaciona pacientes internados, leitos operacionais, leitos
  disponíveis e taxa de ocupação por setor.
- Leitos operacionais são configurados uma única vez pela própria tela do SCIR.
- A consulta é iniciada e repetida a cada cinco minutos somente durante plantão
  ativo; ao encerrar o plantão, o monitoramento é interrompido.
- Mudanças nos totais são registradas no histórico do plantão e incluídas nos
  relatórios PDF e Excel.
- Somente setor, total de pacientes e horário são transmitidos. Nenhum nome,
  prontuário, leito individual, CID ou diagnóstico é enviado ou armazenado.

#### Instalar o conector Hospub

1. Abra `chrome://extensions` no Google Chrome.
2. Ative **Modo do desenvolvedor**.
3. Clique em **Carregar sem compactação** e selecione a pasta
   `conector-hospub` deste pacote.
4. Atualize as abas do Visual Hospub e do SCIR.
5. No Hospub, mantenha aberta a tela **Internação → Consulta por Clínica**.
6. Inicie o plantão no SCIR e abra **Ocupação Hospub**.
7. Configure os leitos operacionais e clique em **Atualizar do Hospub**.

Ao atualizar de uma versão anterior, substitua os arquivos, abra
`chrome://extensions` e clique em **Recarregar** no cartão do conector. Se a
pasta extraída mudou de lugar, remova o conector antigo e carregue novamente a
nova pasta `conector-hospub`.

Não é necessário executar novo SQL nem cadastrar variável adicional na Vercel.

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

O som é reproduzido somente para mensagens novas detectadas durante um plantão
ativo. Mensagens antigas e mensagens recebidas entre plantões não disparam o
alerta. O navegador libera o áudio após a primeira interação do usuário com a
página. O volume final também depende do volume configurado no computador,
tablet ou celular.

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
