# SCIR — NIR CEMETRON

Versão preparada para publicação na Vercel com base PostgreSQL no Supabase. O navegador mantém apenas uma cópia de segurança; a fonte principal passa a ser a nuvem.

## Atualização de uma versão já publicada

Substitua no GitHub os arquivos antigos por todos os arquivos desta versão, preservando as pastas `api`, `lib` e `supabase`. As variáveis já cadastradas na Vercel não precisam ser cadastradas novamente. Após o envio ao GitHub, aguarde o deploy automático ou faça **Deployments → Redeploy**.

Esta versão inclui no Dashboard a área **Segurança e backup dos dados**, com estado da cópia local e da nuvem, teste de sincronização, exportação, importação e recuperação local.

### Versão 1.16.21 — relatório detalhado contínuo no SBAR

- Mantém integralmente a primeira página aprovada, incluindo o **Resumo do plantão** dentro da seção **R** e a frase de continuidade.
- Remove a quebra forçada entre avaliações/exames e autorizações, deixando todos os grupos ocuparem continuamente o espaço disponível.
- Mantém cada registro íntegro e muda de página apenas quando o espaço restante for insuficiente.
- Inclui o bloco **Encerramento do plantão** com a orientação padronizada para confirmação das vagas e acompanhamento das pendências.
- Mantém no rodapé a identificação do médico à esquerda e a data e o horário de emissão à direita.

### Versão 1.16.20 — novo PDF do SBAR

- Aplica ao PDF do SBAR a identidade visual aprovada do SCIR, com a logo oficial do CEMETRON e cartões com bordas arredondadas.
- Mantém na primeira página as seções **S**, **B**, **A** e **R**, incluindo o **Resumo do plantão** dentro da seção **R**.
- Encerra a primeira página com a frase **“Relatório detalhado do plantão nas próximas páginas.”**.
- Inicia a segunda página pela **Produtividade de e-mails**, seguida das pendências, transferências externas e avaliações/exames.
- Reserva a página seguinte para autorizações e negativas, preservando as cores de cada grupo.
- Aguarda o carregamento de todas as logos antes de abrir a impressão, evitando cabeçalhos incompletos no PDF.

### Versão 1.16.19 — aprimoramento visual do censo

- Recupera o padrão visual em cards para Infectologia e Clínica Médica, mantendo as três colunas **Setor**, **Leitos disponíveis** e **Enf/Leito**.
- Substitui a aparência de planilha por linhas leves, espaçamento maior, tags de disponibilidade e identificação visual dos setores.
- Restaura a janela própria de preenchimento, com data, hora, responsável, totais automáticos e observações.
- Posiciona as observações abaixo dos dois cards no resumo da dashboard.
- Mantém o conteúdo de **Enf/Leito** em todos os fluxos já existentes.

### Versão 1.16.18 — arquivo independente sem reutilização da visualização anterior

- Consolida o censo da dashboard com três colunas visíveis: **Setor**, **Leitos disponíveis** e **Enf/Leito**.
- Distribui esta versão em arquivo HTML e pacote com nomes exclusivos, evitando a reabertura da versão anterior chamada “Index 2”.

### Versão 1.16.17 — coluna Enf/Leito sempre preenchível

- Corrige definitivamente a tabela do censo da dashboard para exibir, em cada bloco, **Setor | Leitos disponíveis | Enf/Leito**.
- Mantém um campo livre de preenchimento na coluna **Enf/Leito** em todas as linhas, sem bloqueio condicionado ao quantitativo de vagas.
- Preserva o conteúdo de **Enf/Leito** no salvamento, histórico, SBAR, sincronização e backup.

### Versão 1.16.16 — censo preenchível diretamente na dashboard

- Transforma o censo da dashboard em uma tabela operacional preenchível, sem necessidade de abrir uma janela separada.
- Organiza **Infectologia** e **Clínica Médica** lado a lado, seguindo a lógica visual do modelo fornecido.
- Mantém as colunas **Setor**, **Leitos disponíveis** e **Enf/Leito**, com totais automáticos por bloco e total geral.
- Integra data, hora, responsável, observações e salvamento no histórico do plantão, preservando os dados anteriores.
- Mantém o layout responsivo em celulares e tablets, empilhando os blocos quando necessário.

### Versão 1.16.15 — tabela do censo com três colunas

- Padroniza a tabela do censo com as colunas **Setor**, **Leitos disponíveis** e **Enf/Leito**.
- Mantém o preenchimento da quantidade e da identificação da enfermaria ou do leito em cada setor.
- Preserva a compatibilidade com os censos e backups já registrados.

### Versão 1.16.14 — censo manual no padrão da Ocupação Hospub

- Reorganiza o Censo diário inicial em uma tabela operacional única, próxima ao padrão visual da **Ocupação Hospub**.
- Exibe, por setor, **Leitos disponíveis** e **Enf/Leito**, permitindo identificar as vagas que podem ser cedidas.
- Adiciona indicadores de Infectologia, Clínica Médica e total geral, além dos subtotais por área.
- Mantém a descrição dos leitos no SBAR, histórico, texto copiado, sincronização e backup.

### Versão 1.16.13 — quantidade e identificação dos leitos livres

- Cria duas colunas distintas por clínica: **Nº de leitos livres** e **Quais leitos estão disponíveis**.
- A primeira recebe somente a quantidade, como `2`; a segunda identifica os leitos, como `201, 202`.
- Mantém a identificação dos leitos no Dashboard, no SBAR, no histórico e no texto copiado do censo.

### Versão 1.16.12 — duas colunas de disponibilidade

- Mantém duas informações distintas para cada clínica: **Nº de vagas disponíveis** e **Nº do leito disponível**.
- A primeira coluna registra a quantidade de vagas; a segunda identifica o número do leito, como `201` ou `201, 202`.
- O campo de número do leito permanece habilitado somente quando houver ao menos uma vaga.

### Versão 1.16.11 — identificação dos leitos disponíveis

- Separa, no Censo diário, o **número de vagas disponíveis** da identificação dos **leitos disponíveis**.
- Habilita o campo de identificação dos leitos somente quando o setor possui uma ou mais vagas.
- Exibe os leitos informados no Dashboard, no SBAR, no histórico do plantão e no texto copiado do censo.
- Mantém compatibilidade com censos e backups anteriores, sem perda dos quantitativos já registrados.

### Versão 1.16.10 — identidade oficial nos documentos

- Substitui a logomarca anterior pela imagem oficial do **CEMETRON — Centro de Medicina Tropical de Rondônia**, em maior resolução.
- Insere a logo centralizada no cabeçalho dos PDFs de avaliação, exame, transferência externa, autorização e negativa.
- Mantém o título, a identificação **NIR CEMETRON** e a faixa de cor correspondente a cada tipo de documento.
- Preserva a estética, os dados e as ações de copiar e gerar PDF/imprimir já existentes.

### Versão 1.16.9 — documentos de transferência e simetria do Dashboard

- Atualiza a situação da transferência externa para **Autorizada** ou **Aguardando**.
- Mantém E-mail/RegulaRO e protocolo nos casos que estão aguardando, com migração automática dos registros anteriores.
- Adiciona **Copiar** e **Gerar PDF / Imprimir** ao cartão de transferência externa.
- Aplica a identidade roxa do módulo aos detalhes e ao documento, com tags verde para Autorizada e amarela para Aguardando.
- Alinha os seis indicadores do Dashboard na mesma linha, com dimensões, tipografia e espaçamento uniformes em telas amplas.

### Versão 1.16.8 — transferências externas separadas

- Separa **Transferências externas** de **Avaliações / Exames** nos registros, Dashboard, histórico, estatísticas e SBAR.
- Permite classificar a situação da transferência externa.
- Para solicitações, registra o meio (**E-mail** ou **RegulaRO**) e exige o protocolo quando o RegulaRO for selecionado.
- Para transferências autorizadas, registra destino e **Enfermaria/Leito**.
- Migra automaticamente as transferências antigas para a nova categoria, sem perda de dados.

### Versão 1.16.7 — padronização visual do SBAR

- Padroniza as tags **INFECTO** e **INFECTO/PPL** em verde-claro.
- Altera a tag **CM** para azul-claro.
- Mantém as mesmas cores na visualização e na impressão/PDF do SBAR.
- Corrige o rótulo **HD/PROBLEMAS** para **HD/Problemas** em todas as páginas do SBAR.

### Versão 1.16.6 — Masculina 2 - PPL no censo

- Inclui **Masculina 2 - PPL** na seção Infectologia do **Censo diário**.
- Disponibiliza o campo no formulário de registro e na visualização consolidada do Dashboard.
- Integra o novo setor aos totais, ao histórico, ao SBAR e às exportações.
- Mantém os censos anteriores compatíveis, deixando o novo campo em branco até o próximo preenchimento.

### Versão 1.16.5 — totais do censo diário

- Adiciona uma linha **TOTAL** ao final das colunas de Infectologia e Clínica Médica no **Censo diário**.
- Soma automaticamente os leitos disponíveis informados em cada grupo, considerando zero como valor válido.
- Mantém o total como **—** enquanto nenhum quantitativo tiver sido informado.
- Utiliza o mesmo padrão visual dos totais da tabela **Ocupação Hospub**.

### Versão 1.16.4 — perfil do paciente

- Adiciona ao **Novo registro** a seleção obrigatória do perfil do paciente: Enfermaria, Isolamento, UTI ou Pronto Atendimento.
- Exibe o perfil em tags coloridas: Enfermaria em verde, Isolamento em roxo, UTI em vermelho e Pronto Atendimento em laranja.
- Inclui o perfil nos cartões, documentos, SBAR, relatórios, histórico e exportações PDF/Excel.
- Adiciona filtro e consolidação por perfil do paciente na aba **Estatísticas**.
- Mantém os registros anteriores compatíveis, exibindo **Não informado** quando o perfil ainda não estiver cadastrado.

### Versão 1.16.3 — cores das origens e opção N/A

- Ajusta as tags para **CRUE em vermelho**, **CEREL em laranja**, **Interna em verde** e **Direta em azul**.
- Adiciona a opção **N/A** em cinza e a mantém selecionada por padrão quando nenhuma origem específica é informada.
- Exibe como **N/A** os registros anteriores que ainda não possuem origem da solicitação cadastrada.
- Inclui N/A nos filtros e consolidações da aba **Estatísticas**.

### Versão 1.16.2 — origem da solicitação e ajustes visuais

- Adiciona ao **Novo registro** a seleção obrigatória da origem da solicitação: CRUE, CEREL, Interna ou Direta.
- Exibe cada origem como uma tag com cor própria nos cartões, relatórios, histórico e estatísticas.
- Inclui filtro e consolidação por origem da solicitação na aba **Estatísticas**.
- Padroniza as setas dos campos de seleção e centraliza o conteúdo dos botões.
- Mantém registros anteriores compatíveis, identificando a origem ainda não registrada como **Não informada**.

### Versão 1.16.1 — destino assistido em todos os registros

- Disponibiliza as opções de destino do CEMETRON em todos os tipos de registro, mantendo o preenchimento livre.
- Unifica enfermaria e leito em um único campo **Enfermaria/Leito** nas autorizações.
- Mantém compatibilidade com registros criados na versão anterior.

### Versão 1.16.0 — cadastro assistido de transferências

- Adiciona sugestões de unidades de origem, mantendo o campo livre para outras unidades.
- Nas autorizações de transferência/internação, oferece os destinos do CEMETRON previamente cadastrados.
- Inclui a identificação da enfermaria e do leito nas autorizações.
- Leva destino, enfermaria e leito para os cartões, relatórios, histórico, SBAR e documentos de autorização.
- Remove **Autorização de transferência** da barra lateral e mantém a função dentro de **Novo registro**.

### Versão 1.15.0 — estatísticas dos plantões

- Cria a aba **Estatísticas**, baseada exclusivamente no histórico de plantões encerrados.
- Adiciona filtros combináveis por período, tipo de plantão, plantonista, categoria do registro, origem, destino e busca textual.
- Exibe plantões analisados, registros, média por plantão, e-mails recebidos e tratados e atualizações do censo.
- Apresenta distribuição por categoria, evolução diária, principais unidades de origem e destinos e detalhamento dos registros.
- Exporta todos os resultados filtrados para Excel.

### Versão 1.14.0 — módulo de escalas

- Substitui o acesso direto ao Google Drive por uma página interna **Consultar escalas**.
- Permite cadastrar, editar, abrir e excluir links individuais, identificados por nome e competência ou setor.
- Inclui os links cadastrados na cópia local, na sincronização em nuvem e nos arquivos de backup.
- Mantém **Segurança e backup dos dados** abaixo do módulo **Censo diário**.

### Versão 1.13.2 — organização do Dashboard

- Renomeia o link da barra lateral para **Consultar escalas**.
- Move **Segurança e backup dos dados** para depois do módulo **Censo diário**.

### Versão 1.13.1 — acesso às escalas

- Adiciona à barra lateral o link **Escalas CEMETRON**, que abre a pasta institucional no Google Drive em uma nova aba.

### Versão 1.13.0 — diagnóstico da nuvem e central de backup

- Corrige valores do Supabase colados com espaços, aspas ou com o caminho `/rest/v1` incluído na URL.
- Faz uma segunda tentativa automática em falhas transitórias e aplica tempo-limite às consultas.
- Mostra a causa específica da falha sem revelar URL completa, chave ou outros dados sensíveis.
- Preserva a cópia local quando ela for mais recente que a versão encontrada na nuvem.
- Cria no Dashboard a área **Segurança e backup dos dados**, com datas das últimas gravações local e remota.
- Adiciona o botão **Testar sincronização**.
- Exporta backups identificados e mantém compatibilidade com os arquivos JSON antigos.
- Antes de importar, baixa automaticamente um backup do estado atual e mantém uma cópia de recuperação no navegador.

### Versão 1.12.2 — texto do PDF SBAR

- Corrige a observação para **“Relatório detalhado do plantão nas próximas páginas.”**

### Versão 1.12.1 — sincronização corrigida e proteção local

- Corrige a autenticação da base para chaves novas `sb_secret_`, enviadas
  somente pelo cabeçalho `apikey`, conforme o padrão atual do Supabase.
- Mantém compatibilidade com chaves legadas `service_role` em formato JWT.
- Cada alteração é salva primeiro no navegador e preserva uma cópia local
  anterior para recuperação.
- Uma base remota vazia não substitui automaticamente dados locais existentes;
  o conteúdo local é reenviado para a nuvem.
- O botão **Recuperar cópia local anterior** permite restaurar a versão local
  imediatamente anterior sem perder o estado atual.
- Se a nuvem falhar, o SCIR continua funcionando com os dados locais e tenta
  sincronizar novamente a cada 15 segundos.
- A faixa de status informa que os dados locais estão protegidos enquanto a
  sincronização estiver pendente.

### Versão 1.12 — acesso direto sem login

- A página de login e o botão **Sair** foram removidos.
- O SCIR abre diretamente no Dashboard e carrega a base integrada sem cookie de sessão.
- Sincronização, notificações de e-mail e configuração do Zimbra funcionam sem autenticação prévia no SCIR.
- `ADMIN_USERNAME` e `ADMIN_PASSWORD` deixaram de ser necessários na Vercel.
- `SESSION_SECRET` continua obrigatório exclusivamente para criptografar a senha do Zimbra.

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

### Versão 1.11.6 — alerta de paciente em Sala Vermelha

- Em **PA/Sala Vermelha** e **Sala Vermelha Isolamento**, a coluna
  **Pacientes internados** fica vermelha e recebe o símbolo `⚠` quando o total
  for maior que zero.
- Quando o setor estiver vazio, o indicador permanece verde e sem alerta.
- O alerta utiliza exatamente o mesmo desenho, tamanho e espaçamento do símbolo
  já exibido na taxa de ocupação máxima.

### Versão 1.11.5 — alerta de lotação e tags configuráveis

- Setores com taxa de ocupação igual ou superior a 100% exibem o símbolo `⚠`
  dentro da coluna **Taxa de ocupação**.
- O botão **Configurar leitos e tags** permite escolher individualmente a tag
  assistencial de cada setor.
- Opções disponíveis: sem tag, `INFECTO`, `CM`, `INFECTO/CM`,
  `INFECTO/PPL` e `PPL`.
- A escolha é salva na nuvem junto com a configuração de leitos.
- Masculina 2 passa a usar inicialmente a tag `INFECTO/PPL`.

### Versão 1.11.4 — destaque visual dos setores críticos

- Linhas de PA receberam fundo amarelo suave.
- Linhas de Sala Vermelha receberam fundo vermelho suave, inclusive
  **PA/Sala Vermelha**.
- Linhas de UTI receberam fundo laranja suave.
- Uma faixa lateral mais intensa reforça cada categoria sem prejudicar a
  leitura das tags e dos indicadores.

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
| `SESSION_SECRET` | Texto aleatório com pelo menos 32 caracteres, usado para proteger a senha do Zimbra |

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

Se a nova versão substituir um site já publicado **no mesmo domínio**, abra-a primeiro no navegador que contém os dados antigos. Se a base estiver vazia, o sistema envia automaticamente a cópia local existente ao Supabase.

Se o sistema anterior era aberto como arquivo HTML no computador ou estava em outro domínio, o navegador não permite que o novo site leia diretamente aqueles dados. Nesse caso, obtenha o JSON da base antiga e use **Importar backup**. A chave usada pela versão anterior é `nirCemetronFinalStateV2`. No Chrome, ela pode ser consultada em Ferramentas do desenvolvedor → Application → Local Storage. Guarde uma cópia antes de qualquer migração.

Depois da primeira migração, todos os dispositivos que acessarem o endereço do SCIR passam a compartilhar a mesma base. O botão **Exportar backup** gera uma cópia JSON para segurança ou transferência manual.

## Segurança

- A chave privilegiada do Supabase fica somente nas funções da Vercel e nunca é enviada ao navegador.
- O SCIR abre diretamente, sem usuário, senha ou cookie de sessão. Portanto, o endereço publicado deve ser compartilhado somente com a equipe autorizada.
- A tabela não permite acesso direto pelas chaves públicas do Supabase.
- A senha do Zimbra é criptografada com AES-256-GCM usando uma chave derivada
  do `SESSION_SECRET` configurado na Vercel.
- A senha nunca é incluída no pacote, no GitHub ou nas respostas enviadas ao navegador.
- Corpo e anexos do e-mail não são processados.
- Não publique arquivos `.env` nem coloque senhas diretamente no código.

## Backup

O Supabase mantém os dados em PostgreSQL. Para uma cópia adicional, use os relatórios e exportações do próprio SCIR e habilite os backups disponíveis no plano escolhido do Supabase.
