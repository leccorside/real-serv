# Histórico do Projeto - App RealServ

**[2026-03-01]** - Inicialização do Projeto & Infraestrutura

**Descrição**
Configuração do Expo com Expo Router, NativeWind (Tailwind CSS) e estrutura base do projeto. Integração do Zustand para persistência em armazenamento local (AsyncStorage) e React Query para busca de dados em API.

**Arquivos Afetados**

- aplicativo/package.json
- aplicativo/app/\_layout.tsx
- aplicativo/store/\*
- aplicativo/hooks/\*

**Tipo**

- Feature

**[2026-03-10]** - Implementação de Autenticação & Biometria Facial

**Descrição**
Desenvolvimento da tela de login com CPF/Senha (LoginHandler.ashx). Suporte tanto para usuários do sistema quanto para funcionários diretos (Fallback). Implementação do processo de cadastro facial de 6 passos e da tela de reconhecimento facial.

**Arquivos Afetados**

- aplicativo/app/(auth)/login.tsx
- aplicativo/app/(auth)/facial-enrollment.tsx
- aplicativo/app/(auth)/facial-recognition.tsx
- Handlers/LoginHandler.ashx
- Handlers/BioHandler.ashx
- Handlers/FaceAuthHandler.ashx

**Tipo**

- Feature

**[2026-03-15]** - Funcionalidades Principais de Controle de Ponto

**Descrição**
Tela de Início (Home) com acompanhamento em tempo real, fluxo de registro de ponto (Entrada, Saída Almoço, Retorno Almoço, Saída) com captura de localização GPS e lógica de sincronização offline-first.

**Arquivos Afetados**

- aplicativo/app/(app)/home.tsx
- aplicativo/app/(app)/confirm-point.tsx
- aplicativo/store/useTimeTrackingStore.ts
- Handlers/PontoHandler_vFinal.ashx

**Tipo**

- Feature

**[2026-03-18]** - Recuperação e Estabilidade (Melhorias da Etapa 5)

**Descrição**
Restauração do trabalho perdido devido ao comando 'git restore .'. Implementação de otimização de qualidade de imagem (0.7), isolamento de sessão durante o logout (limpeza de registros) e análise robusta de JSON para lidar com respostas de erro não-JSON da API. Integrado scan de autenticação facial real.

**Arquivos Afetados**

- aplicativo/store/useTimeTrackingStore.ts
- aplicativo/store/useAuthStore.ts
- aplicativo/app/(auth)/facial-enrollment.tsx
- aplicativo/app/(auth)/facial-recognition.tsx
- aplicativo/app/(app)/confirm-point.tsx

**Tipo**

- Fix | Improvement

**Notas**
Todos os itens foram restaurados a partir da documentação de backup após o comando acidental.

**[2026-03-18]** - Fluxo de Identificação Prévia (CPF/RE) para Biometria

**Descrição**
Ajuste no fluxo de login para exigir que o usuário insira seu CPF/RE antes de acessar as opções de biometria facial. O identificador agora é validado no modal de opções e passado automaticamente para as telas de cadastro e reconhecimento facial, eliminando duplicidade de entrada e garantindo que o servidor saiba qual perfil validar.

**Arquivos Afetados**

- aplicativo/app/(auth)/login.tsx
- aplicativo/app/(auth)/facial-enrollment.tsx
- aplicativo/app/(auth)/facial-recognition.tsx

**Tipo**

- Improvement | UX

**[2026-03-18]** - Padronização de Acesso via CPF

**Descrição**
Remoção de todas as menções ao identificador "RE" na interface do usuário (labels, placeholders e alertas), unificando a comunicação em torno do CPF. Esta mudança prepara o aplicativo para a futura validação exclusiva via CPF, simplificando a experiência do colaborador.

**Arquivos Afetados**

- aplicativo/app/(auth)/login.tsx
- aplicativo/app/(auth)/facial-recognition.tsx

**Type**

- Improvement | UI

**[2026-03-18]** - Configuração da Tela de Carregamento (Splash Screen)

**Descrição**
Configuração da **Splash Screen** oficial no `app.json`, utilizando o ícone do Leão (`icon.png`). Além disso, foi realizada a substituição **forçada dos arquivos nativos** e do **ícone adaptativo do Android** (`android-icon-foreground.png`), eliminando definitivamente a logo padrão ("A" azul) que ainda persistia no carregamento.

**Arquivos Afetados**

- aplicativo/app.json
- aplicativo/assets/images/android-icon-foreground.png
- aplicativo/android/app/src/main/res/drawable-\*/splashscreen_logo.png
- aplicativo/assets/images/icon.png

**Type**

- Improvement | UI
  **[2026-03-18]** - Simplificação do Fluxo de Login

**Descrição**
Remoção da opção "Esqueci minha senha" da tela de login, simplificando a interface e o fluxo de acesso conforme solicitação do usuário.

**Arquivos Afetados**

- aplicativo/app/(auth)/login.tsx

**Type**

**[2026-03-18]** - Suporte a CPF e CNPJ com Máscara Dinâmica

**Descrição**
Expandido o sistema de login e validação para suportar tanto CPF quanto CNPJ:
- **Interface Mobile:** O campo de login agora possui máscara dinâmica automática para CPF (000.000.000-00) e CNPJ (00.000.000/0000-00).
- **Backend Consolidado:** O `LoginHandler.ashx` agora trata ambos os documentos com proteção contra formatação via SQL `REPLACE`. Aceita o parâmetro `checkOnly=true` para validação pré-biométrica sem senha.
- **UX:** Atualizados labels e placeholders para "CPF ou CNPJ".

**Arquivos Afetados**
- Handlers/LoginHandler.ashx
- aplicativo/app/(auth)/login.tsx

**Type**
- Feature | UX

**[2026-03-18]** - BUG FIX e Refinamento de Parâmetros (Biometria)

**Descrição**
Finalização do fluxo de acesso facial com resolução de bug técnico de detecção no servidor:
- **Resolução de Bug (Server):** Corrigido o problema onde o ASP.NET concatenava valores duplicados (ex: `true,true`) quando o parâmetro `checkonly` era enviado simultaneamente via QueryString e Form. O `LoginHandler.ashx` agora utiliza detecção via `.Contains("true")`.
- **Padronização:** Unificação do parâmetro para `checkonly` em minúsculo em todas as camadas para evitar problemas de sensibilidade a caso.

**Arquivos Afetados**
- Handlers/LoginHandler.ashx
- aplicativo/app/(auth)/login.tsx

**Type**
- Fix | Refactor

**[2026-03-18]** - Estabilização da Biometria e Refinamento de UX

**Descrição**
Ciclo de finalização da biometria facial e polimento da interface do aplicativo.
- **Biometria:** Estabilização do fluxo de cadastro (6 fotos) com suporte a TLS 1.2 e tratamento de grandes payloads (JSON 50MB) no ASP.NET. Correção de esquema SQL na tabela `PessoasAnexos` (`RegDtInicio`).
- **UX Minimalista:** Removidos ícones de notificações, localização e mapas da Home e da tela de Registro.
- **Ajuste de Proporções & Uniformidade:** Refinada a escala dos cards e do cabeçalho de ponto para garantir dimensões idênticas em todos os cards e melhor legibilidade com fontes otimizadas.
- **Dinamismo & Layout:** Implementada atualização automática na Home e ajuste do layout de intervalo para exibição lado a lado.
- **Prevenção de Erros:** Bloqueio de batidas duplicadas no mesmo dia com exibição do horário registrado na tela de seleção.
- **Bug Fix (Histórico):** Corrigido erro de chaves duplicadas (`key '1'`) na tela de registros através da geração de IDs únicos por tipo de batida no mapeamento do Store.
- **Histórico Dinâmico:** Implementada filtragem reativa por Mês e Semana, com cálculo automático de horas reais trabalhadas e variação percentual (%) comparada ao período anterior.
- **Unificação de Dados:** Criado utilitário `time.ts` para centralizar o algoritmo de cálculo de horas, eliminando discrepâncias entre a Home e o Histórico.
- **Reatividade Offline:** Corrigida falha de subscrição no Zustand; a Home e o Registro agora atualizam instantaneamente após a sincronização automática de dados offline.
- **Pull-to-Refresh:** Adicionado suporte ao gesto de swipe down (deslizar para baixo) na Home para atualização manual de registros e sincronização.
- **Logout Automático:** Implementado modal de sucesso com contagem regressiva de 15 segundos após o registro de ponto, forçando o logoff por segurança ou permitindo logout imediato via botão.
- **Ponto Offline no Login:** Desenvolvido sistema de contingência na tela de login que detecta queda de internet e permite o registro de ponto via CPF com captura de foto obrigatória, além de bloqueio inteligente de batidas e exibição de horários, salvando os dados localmente para sincronização automática posterior.
- **Sincronização Resiliente:** Corrigida falha no envio de fotos offline através da conversão automática de URIs locais para Base64 antes do sync via `ImageManipulator`, garantindo compatibilidade total com o servidor em todas as telas (`Home`, `Login`, `Ponto`).

**Arquivos Afetados**
- Handlers/BioHandler.ashx
- Handlers/FaceAuthHandler.ashx
- aplicativo/app/(app)/(tabs)/home.tsx
- aplicativo/app/(app)/register-point.tsx
- aplicativo/store/useTimeTrackingStore.ts

**Type**
- Feature | Fix | UX | Refactor

**[2026-03-18]** - Tratamento de Erro `lastBase64 of null`

**Descrição**
Corrigido um bug crítico onde a referência da câmera (`cameraRef.current`) era desmontada da tela após a captura da foto, causando o erro "Cannot read property 'lastBase64' of null" ao tentar registrar o ponto. A foto em Base64, antes atrelada imperativamente ao componente da câmera, agora é persistida usando novos estados nativos do React (`tempBase64` e `capturedBase64`) para garantir que os dados não se percam quando a interface de câmera é fechada, tanto em modo online quanto no fallback offline do login.

**Arquivos Afetados**
- aplicativo/app/(auth)/login.tsx
- aplicativo/app/(app)/confirm-point.tsx

**Type**
- Fix

**[2026-03-18]** - Bloqueio de Batidas Duplicadas no Login Offline

**Descrição**
Corrigida a lógica de filtragem que verificava a existência de batidas prévias durante o registro de Ponto Offline no Login. 
1. **Dados de Sessão:** A tela de login não possui usuário ativo, de forma que o `getTodayRecords()` retornava sempre vazio. A consulta foi alterada para pesquisar no estado global (`records` e `pendingSyncRecords`) usando o CPF preenchido em tempo real.
2. **Correção de Fuso Horário:** Os registros pendentes recém-criados enviam a data e hora via `toISOString()` (baseado no fuso UTC), avançando um dia civil após as 21:00h no Brasil; Isso invalidava as verificações baseadas apenas em strings prefixadas localmente. A verificação foi ajustada para utilizar estritamente `isToday(parseISO())` da biblioteca Date-Fns. 

Com essa refatoração, o sistema confere perfeitamente se você já registrou um evento hoje e bloqueia o botão associado confiavelmente.

**Arquivos Afetados**
- aplicativo/app/(auth)/login.tsx

**Type**
- Fix

**[2026-03-18]** - Correção de Sincronização de Payload Offline (Mapeamento de Usuário)

**Descrição**
Corrigido um erro silencioso onde registros criados via tela de Login (Modo Avião) não eram salvos no banco de dados após a internet retornar. 
A API legada (`PontoHandler_vFinal.ashx`) exigia um `usuarioId` no formato "P123" (Sessão do Banco), mas a batida de emergência guardava e enviava apenas o CPF limpo (`03407547102`) já que não existia comunicação com o servidor na hora do clique. Isso causava um erro interno de conversão SQL ao receber uma string de 11 dígitos num campo numérico.
1. O backend foi refatorado para aceitar uma flag `isCpf` no FormData. Quando a flag é detectada, o C# faz uma busca reversa por documento na tabela `Pessoas` (ou `Usuarios`) para encontrar o respectivo `PessoaID` automaticamente.
2. O aplicativo (front-end no Zustand) foi atualizado injetando `isCpf=true` no pacote de rede do caso de uso de batidas avulsas não autenticadas (`record.userId`).

A sincronização agora resgata dados em abismo sem erro no banco de dados SQL.

**Arquivos Afetados**
- Handlers/PontoHandler_vFinal.ashx
- aplicativo/store/useTimeTrackingStore.ts

**Type**
- Fix | Backend

**[2026-03-18]** - Prevenção de Payload Too Large do IIS (Sincronização)

**Descrição**
Corrigida uma falha sistêmica que passou a rejeitar envios de batida de ponto nos 3 cenários (Facial, CPF e Offline). Ao migrar o armazenamento de fotos do temporário `(cameraRef.current).lastBase64` para o novo ambiente persistente em memória RAM do React Router, o script começou a transmitir o texto Base64 em "Qualidade Máxima" e resolução crua da câmera moderna (+ de 5MB) de uma só vez, excedendo o hard limit do `MaxRequestLength` padrão do C# (4 MB), o que derrubava a requisição no IIS sem avisos (Status 404.13/500).
A camada de sincronização `simulateSync()` foi retrabalhada para aplicar o `ImageManipulator` não apenas em arquivos `file://`, mas detectando as strings brutas de Base64 em memória e esmagando-as (resize 800px @ 60% compression) rigorosamente antes do envio HTTP. Os uploads passaram a gastar menos de ~200KB sem chance de derrubar o servidor, reestabelecendo a gravação nas tabelas SQL independentemente de como o ponto for emitido.

**Arquivos Afetados**
- aplicativo/store/useTimeTrackingStore.ts

**Type**
- Fix | Performance

**[2026-03-18]** - Correção de Bloqueio em Múltiplos Registros (Saída Almoço/etc)

**Descrição**
Solucionado o problema onde o "Primeiro Registro" (Entrada) funcionava, mas os demais não eram gravados em nenhum tipo de login. A falha residia no `PontoHandler_vFinal.ashx`. Quando o funcionário batia o primeiro ponto, o banco de dados criava a linha e inseria o valor default `"--:--"` nas colunas vazias (AlmocoSaida, AlmocoRetorno). 
No C#, a checagem falha testava apenas se o registro existente "não era nulo nem vazio" (`!string.IsNullOrEmpty`), o que retornava `verdadeiro` para os traços, bloqueando prematuramente com a mensagem falsa: *"Você já realizou a marcação..."*, cancelando silenciosamente o envio ao SQL (o App abortava e enfileirava).
Foi incluída a checagem que ignora o valor `"--:--"` estipulando que trata-se de um slot não consumido, permitindo a execução do `UPDATE`. Além disso, fortificou-se os campos Latitude, Longitude e Foto para enviarem `DBNull.Value` genuínos no lugar de strings vazias, evitando crash sistêmico com colunas de logitude na base de dados.

**Arquivos Afetados**
- Handlers/PontoHandler_vFinal.ashx

**Type**
- Fix | Backend

**[2026-03-18]** - Otimização de UX: Remoção da Trava de GPS no Registro

**Descrição**
A tela de "Confirmar Ponto" exigia captura local e estrita das coordenadas de GPS antes de habilitar o botão de conclusão, resultando num comportamento lento e obstrutivo ("Obtendo GPS..."). 
Como o sistema adotará a captura de localização assíncrona/em background globalmente, limpou-se o ciclo de vida da tela de confirmação: o `useEffect` de busca de satélite do Expo Location foi depenado, seu ActivityIndicator foi suprimido e o botão "Confirmar Ponto" agora nasce pré-habilitado para envios imediatos e sem fricção.

**Arquivos Afetados**
- aplicativo/app/(app)/confirm-point.tsx

**Type**
- UI/UX | Feature

**[2026-03-19]** - Isolamento Temporal de Plantões Noturnos (Data Limpa vs DateTime)

**Descrição**
Ao tentar resolver as batidas que atravessavam a meia-noite (Plantões Noturnos) com a regra de "últimas 20 horas do GETDATE()", observou-se uma regressão: a Saída Final da noite parou de registrar.
A causa provou ser uma particularidade estrita do banco `ControlePonto`, onde a coluna `DataRegistro` armazena exclusivamente Mês/Dia/Ano absolutos e ignora o relógio interno (ex: salva como `2026-03-18 00:00:00`). Como a batida de saída foi testada às `00:31` do dia 19/03, o cálculo das `-20 horas` exigia que o banco achasse um plantão aberto no mínimo acima de `18/03 às 04:30da Madrugada`. Mas como a data guardava apenas `00:00:00` zerdas, a matemática do SQL rejeitava a linha de ontem (`00:00 < 04:30`), assumindo que a validade do plantão já tinha expirado.
O `PontoHandler_vFinal.ashx` foi ajustado definitivamente: 
- O Ponto genérico de **"Entrada"** exige encontrar (ou abrir um novo) plantão rigorosamente com a *data de Hoje* (`CONVERT(date, GETDATE())`).
- Os Pontos Intermediários e Finais (**Almoço, Saída**) ampliam a varredura ordenando `TOP 1` dos plantões em aberto baseados em **"Hoje ou Ontem" (`DATEADD(DAY, -1)`)** sem se abalar pelas frações decimais de horas corridas. Esse modelo é totalmente imune a atrasos ou turnos de madrugada.

**Arquivos Afetados**
- Handlers/PontoHandler_vFinal.ashx

**Type**
- Fix | Backend

**[2026-03-19]** - Correção Crítica: HandleGet não Reconhecia CPF como Identificador

**Descrição**
Identificado um bug duplo e contraditório: o método `HandleGet` do `PontoHandler_vFinal.ashx` não reconhecia CPF (11 dígitos numéricos) como identificador válido de pessoa. Ele só aceitava o formato `P+número`. Logo, quando o app mobile enviava `busca=03407547102`, o GET retornava `[]` (nenhum registro encontrado).
Ao mesmo tempo, o `HandlePost` buscava por `PessoaID` após resolver o CPF, encontrando o registro e bloqueando a inserção com "Você já realizou a marcação".
Isso criava um comportamento paradoxal: o app mostrava os cards de ponto todos vazios (--:--) mas rejeitava qualquer nova batida como "já registrada".
Adicionado bloco de resolução de CPF → PessoaID no `HandleGet`, espelhando a mesma lógica já presente no `HandlePost`.

**Arquivos Afetados**
- Handlers/PontoHandler_vFinal.ashx

**Type**
- Fix | Backend

**[2026-03-19]** - Correção: Omissão da Última Foto (Óculos) no Cadastro Facial

**Descrição**
O app não estava salvando a 6ª foto (Passo 6 - Óculos) durante o cadastro facial.
O problema ocorria devido à assincronicidade do estado do React no frontend `facial-enrollment.tsx`: a função `confirmPhoto` atualizava o array `capturedImages` e invocava imediatamente `finishEnrollment()`. Porém, devido à closure da função, o escopo lido ainda pertencia ao estado anterior (que possuía apenas 5 fotos). As requisições encerravam o Form sem a foto número 6.
A função `finishEnrollment(finalImages)` foi corrigida para aceitar a injeção do vetor atualizado por parâmetro, contornando a latência do State.

**Arquivos Afetados**
- aplicativo/app/(auth)/facial-enrollment.tsx

**Type**
- Fix | Frontend

**[2026-03-19]** - Feature: Botão de Logout na Home

**Descrição**
Adicionado um ícone/botão de "Logout" no canto superior direito do cabeçalho da tela principal (`home.tsx`). O botão chama a função de limpeza de sessão `logout()` e redireciona o usuário imediatamente para a tela de autenticação, melhorando a navegabilidade do app.

**Arquivos Afetados**
- aplicativo/app/(app)/(tabs)/home.tsx

**Type**
- Feature | Frontend

**[2026-03-19]** - Correção: Imagem Quebrada (Thumb) no Painel de Edição

**Descrição**
Na tela Web de Edição do Funcionário (`Pessoas/Criar/17388/O`), a foto de perfil recém-tirada pelo App estava quebrada (404 Not Found), pois a página MVC nativamente adicionava a palavra `thumb` ao nome do arquivo (ex: `foto_17388_bio_0_123thumb.jpg`), diferindo do nome exato salvo pelo celular.
No `BioHandler.ashx`, incluí uma instrução que faz uma cópia da foto frontal (foto 0) aplicando o sufixo `thumb.jpg` no ato do salvamento. Aproveitando-se do fato que o App Mobile já comprime e redimensiona a foto nativamente (800px width), a duplicação direta atende plenamente o requisito de tamanho reduzido para o sistema antigo de painéis sem engasgar o servidor.

**Arquivos Afetados**
- Handlers/BioHandler.ashx

**Type**
- Fix | Backend

**[2026-03-19]** - Correção: Batidas de Ponto Sumindo Imediatamente da Tela (Zustand Wipe)

**Descrição**
O app apresentava uma falha visual onde, em todos os três cenários de registro (CPF/Senha, Offline, Facial), a batida recém registrada não aparecia na `home.tsx`.
A causa não era no Backend (que gravava perfeitamente). O problema ocorria no Gerenciador de Estado do React (`useTimeTrackingStore.ts`). 
Ao registrar um ponto, o app salvava o registro na lista de *Pendentes*. Em seguida, a tela Home forçava uma atualização (`fetchTodayRecords`) que sobrescrevia de forma agressiva todos os registros visuais pelo que estava salvo no servidor remoto. Como o servidor ainda não havia recebido o ponto recém-criado, a Home apagava a batida da interface, causando confusão.
Foi adicionada uma lógica de "Merge" onde o `fetchTodayRecords` preserva e costura junto os registros `pendingSyncRecords` criados na sessão atual, impedindo que o ponto desapareça até que o servidor confirme seu recebimento. Também foi adicionado um acionador automático (`simulateSync`) logo após salvar um ponto localmente.

**Arquivos Afetados**
- aplicativo/store/useTimeTrackingStore.ts

**Type**
- Fix | Frontend

**[2026-03-19]** - Correção: Falha de Sincronização dos Pontos Offline (Memory/IIS Crash)

**Descrição**
O app passou a salvar os registros logados normalmente, mas os registros puramente Offline (feitos pela tela de login) não estavam subindo para o banco quando a internet voltava.
A causa identificada é que a tela `login.tsx` estava armazenando temporariamente a selfie na memória do dispositivo no formato "Raw Base64" não comprimido (que chega facilmente a mais de 5 Megabytes de texto por foto). Quando a conexão voltava, o gerenciador de Sincronismo (`useTimeTrackingStore`) engasgava ao tentar processar e enviar esse payload monstro, sendo derrubado silenciosamente pelo limite padrão do IIS (Http 413 Payload Too Large / 404.0 Connection Closed) no Servidor C#.
A solução foi trocar a lógica do Ponto Offline para salvar apenas o Caminho Físico da foto (`file://...`). Dessa forma, a memória não sobrecarrega, o compressor no fundo consegue abrir o arquivo local otimizando-o e o upload ocorre suavemente pesando apenas 50KB.

**Arquivos Afetados**
- aplicativo/app/(auth)/login.tsx

**Type**
- Fix | Frontend

**[2026-03-19]** - Feature: Desbloqueio Dinâmico do Painel de Ponto Offline

**Descrição**
Anteriormente, os botões do Ponto Offline (Entrada, Saída, etc.) ficavam bloqueados no App durante todo o dia baseados apenas no cache local do dispositivo. Se um administrador deletasse o ponto equivocado no Banco de Dados direto no servidor, o App não sabia da exclusão e continuava bloqueando novas batidas na tela inicial de Login.
Foi incluído um gatilho de "Hot-Sync": a partir de agora, no exato segundo que o usuário clicar no botão "Ponto Offline", se o celular possuir qualquer conexão com a internet, o App fará uma consulta ultrarrápida no banco de dados do servidor usando o CPF. Se o ponto foi apagado pelo Admin, o cache local é atualizado instantaneamente e os botões da modal abrem desbloqueados, permitindo uma nova batida. Se o celular estiver sem internet, ele continuará confiando no bloqueio local seguro.

**Arquivos Afetados**
- aplicativo/app/(auth)/login.tsx

**Type**
- Feature | Frontend

**[2026-03-19]** - Correção Crítica: Regressão no Sync de Pontos Offline (File URI)

**Descrição**
A tentativa anterior de baratear o consumo de memória usando URI (`file://`) causou uma quebra silenciosa no envio. Como os arquivos do Expo Camera são temporários, se o App fosse fechado (ou o Cache limpo pelo SO) antes de religar a internet, o Sincronizador de fundo não achava o arquivo físico e enviava a string textual `"file:///..."` pro servidor C#, que bloqueava a requisição.
Para contornar e ter o melhor dos mundos (sobrevivência do cache e leveza de rede), revertemos a lógica para salvar Base64 no banco local, porém injetando o `ImageManipulator` **no momento exato do clique**. A foto gigantesca é instantaneamente transformada em um Base64 otimizado de ~50KB e cravada no Banco AsyncStorage. Isso não fere a RAM, não aciona o limite do IIS de 4MB e garante que a batida offline viva semanas se o celular ficar sem Wi-Fi!

**Arquivos Afetados**
- aplicativo/app/(auth)/login.tsx

**Type**
- Fix | Frontend

**[2026-03-19]** - Correção Crítica: Sincronização em Loop Falso (Async Hang)

**Descrição**
Após aplicarmos a compressão simultânea no ato do clique (para proteger a memória RAM), surgiu um bug colateral na fila de envio: o Sincronizador do banco local (`useTimeTrackingStore`) estava tentando recomprimir as fotos de novo antes de enviar para o servidor. Passar uma string Base64 compacta de volta para o compressor interno do React Native (`ImageManipulator`) causava um *"Silent Async Hang"* — o processo simplesmente congelava a Thread na memória do Android, sem lançar erro nem fechar o aplicativo.
Isso fazia a fila travar em estado de loop infinito. Como a sincronia nunca concluía nem dava falha, os pontos nunca chegavam no banco de dados e a tela Offline continuava detectando o ponto preso no celular localmente e bloqueando o botão!
A fila de envio (`simulateSync`) foi consertada para apenas repassar os dados Base64 puros para a Rede (Network Fetch) sem tentar recomprimi-los, resolvendo o Hang de vez e permitindo o envio verdadeiro.

**Arquivos Afetados**
- aplicativo/store/useTimeTrackingStore.ts

**Type**
- Fix | Frontend

**[2026-03-19]** - Correção: Prioridade de Fonte de Dados (Online=Servidor / Offline=Cache Local)

**Descrição**
O app exibia horários da memória local mesmo quando havia internet, ignorando os dados reais do banco do servidor.
Isso acontecia porque `fetchTodayRecords` mesclava os registros locais (`pendingSyncRecords`) com os dados do servidor, causando fantasmas de horários antigos persistirem na tela.
A regra agora é simples:
- **Com internet**: Os dados vêm exclusivamente do servidor (C#). A função `fetchTodayRecords` sobrescreve o cache local com os dados reais.
- **Sem internet**: Exibe o cache local como fallback seguro.
Além disso, após sincronizar um ponto offline com sucesso, o app agora re-busca os dados atualizados no servidor automaticamente para confirmar a ação e atualizar a UI com os dados verdadeiros.

**Arquivos Afetados**
- aplicativo/store/useTimeTrackingStore.ts

**Type**
- Fix | Frontend
