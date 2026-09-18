# Mensagens Rápidas 🚀

**Mensagens Rápidas** é uma extensão desenvolvida para otimizar o atendimento no SAC Messenger da ASC Brazil e no chat do Blip. Ela permite gerenciar, favoritar e inserir mensagens pré-definidas instantaneamente nos campos de chat ou busca, eliminando a digitação repetitiva.

## ✨ Funcionalidades

- **Widget Flutuante**: Interface moderna, semi-transparente e com efeito de vidro (blur), que pode ser movida e redimensionada na tela.
- **Redimensionamento Total**: Ajuste a largura pelas laterais e a altura pelo topo e rodapé do widget. O tamanho e a posição ficam salvos e são restaurados mesmo depois de recarregar a página.
- **Busca por Texto**: Filtre a lista de mensagens digitando um trecho do texto, além do filtro por tag. O trecho encontrado fica destacado no card, atualizando em tempo real.
- **Método Nuclear de Preenchimento**: Algoritmo robusto que localiza campos de texto mesmo dentro de múltiplos iFrames, limpando o campo antes da inserção para evitar erros.
- **Trava Anti-Duplicidade**: Sistema de controle de fluxo que impede a inserção duplicada de mensagens em cliques rápidos ou instabilidades do site.
- **Confirmação Visual**: Ao inserir uma mensagem, o card pisca em verde por um instante confirmando que o texto foi enviado ao campo.
- **Categorização por Tags**: Organize suas mensagens por categorias (Ex: GERAL, FINANCEIRO, SUPORTE), cada uma com uma cor própria para identificação rápida.
- **Contador por Categoria**: Cada filtro de tag mostra quantas mensagens existem naquela categoria.
- **Sistema de Favoritos**: Marque as mensagens mais usadas com uma estrela (que brilha em amarelo quando ativa, inclusive ao passar o mouse) para que fiquem no topo da lista.
- **Aba de Recentes**: Acesse rapidamente as últimas 5 mensagens que você inseriu, sem precisar procurar na lista.
- **Reordenação por Arraste**: Clique e arraste qualquer card para reorganizar suas mensagens na ordem que preferir. Favoritas continuam fixadas no topo, mas podem ser reordenadas entre si, assim como as demais.
- **Filtros Ágeis**: Filtre rapidamente por tags, veja apenas as favoritadas ou as recentes.
- **Desfazer Exclusão**: Ao apagar uma mensagem individual, uma barra permite desfazer a ação por 20 segundos para restaurar a mensagem.
- **Aviso de Texto Não Salvo**: Cancelar o formulário com texto digitado (e ainda não salvo) pede confirmação antes de descartar.
- **Indicador de Edição**: O card que está sendo editado no momento fica com a borda destacada, deixando claro qual mensagem o formulário está alterando.
- **Sincronização Entre Abas**: Alterações feitas em uma aba (editar, apagar, favoritar) aparecem automaticamente em outras abas abertas com o widget.
- **Menu de Backup**: Um ícone de engrenagem ao lado do botão de incluir mensagem abre um menu compacto com todas as ações de gerenciamento, sem ocupar espaço permanente na tela. O menu fecha automaticamente após 15 segundos de inatividade (pausando enquanto o mouse está sobre as opções), e também assim que uma exportação ou importação é concluída.
  - **Selecionar Mensagens**: Ativa checkboxes nos cards para marcar várias mensagens específicas e apagar ou exportar só aquelas de uma vez, com opção de "Selecionar Tudo" para marcar todas as visíveis no filtro atual.
  - **Exportar / Importar**: Salve todas as mensagens em um arquivo JSON ou restaure a partir de um backup. Ao importar, um modal com botões deixa escolher entre **Mesclar** (soma às mensagens atuais) ou **Substituir Tudo**. A importação valida a estrutura do arquivo antes de aplicar, evitando dados corrompidos.
  - **Apagar Categoria**: Um dropdown discreto e rolável lista todas as tags com a quantidade de mensagens de cada uma. Clicar em uma tag apaga só as mensagens daquela categoria, sempre pedindo confirmação antes.
  - **Apagar Tudo**: Remove todas as mensagens salvas de uma vez, também com confirmação obrigatória informando o total que será apagado.
- **Estado Vazio Orientativo**: Quando não há mensagens cadastradas ou nenhuma bate com o filtro/busca, o widget mostra uma mensagem explicando o que fazer.
- **Skeleton de Carregamento**: Enquanto as mensagens são carregadas, blocos animados ocupam o lugar da lista, evitando a sensação de tela vazia.
- **Atalhos de Teclado**: `Alt + Q` abre o widget expandido quando fechado e alterna entre minimizar à barra de título e restaurar o tamanho anterior quando visível. `Alt + W` fecha ou reabre o widget, preservando seu estado. `Alt + N` abre o widget direto no formulário de nova mensagem.

## 🌐 Domínios Suportados

- `*.ascbrazil.com.br` (SAC Messenger)
- `*.blip.ai` (Chat Blip)

## 🛠️ Tecnologias Utilizadas

- **JavaScript (ES6+)**: Lógica principal e manipulação de DOM.
- **Chrome Extension API (Manifest v3)**: Estrutura moderna para extensões de navegador.
- **CSS3**: Estilização avançada com animações e filtros de Backdrop.
- **Chrome Storage Local**: Persistência de dados das mensagens, posição/tamanho do widget e histórico de recentes no navegador.

## 🚀 Como Instalar (Modo Desenvolvedor)

1. Faça o download ou clone este repositório.
2. Abra o Microsoft Edge (ou Chrome) e acesse `edge://extensions` (ou `chrome://extensions`).
3. Ative o **Modo do desenvolvedor** no canto inferior esquerdo.
4. Clique em **Carregar descompactada** e selecione a pasta onde estão os arquivos do projeto.
5. A extensão aparecerá no seu navegador. Acesse o domínio da ASC Brazil ou do Blip e clique no ícone ou use `Alt + Q`.

## 📌 Uso

1. Clique em **Incluir Mensagem** para cadastrar seus textos (ou use `Alt + N`).
2. Escreva a mensagem e clique em **Salvar**. Na etapa seguinte, selecione uma tag já cadastrada ou digite uma nova e confirme para salvar. A lista usa a rolagem no estilo da extensão. Tag vazia usa **GERAL**; **Voltar ao texto** preserva o rascunho. O ícone de tag abre diretamente essa etapa na edição.
3. Para usar: **Clique primeiro no campo de texto** (onde você digita no chat ou na barra de busca) e depois clique na mensagem desejada dentro do widget.
4. Para encontrar uma mensagem rapidamente, use o campo de busca ou os filtros de tag/favoritos/recentes no topo da lista.
5. Para redimensionar, arraste qualquer uma das quatro bordas do widget. O tamanho e a posição ficam salvos automaticamente.
6. Para reordenar, clique e arraste o card da mensagem para a posição desejada.
7. Para fazer backup, apagar mensagens ou selecionar várias de uma vez, clique no ícone de engrenagem (⚙) ao lado de "Incluir Mensagem". Lá você encontra Selecionar Mensagens, Exportar, Importar, Apagar Categoria e Apagar Tudo (todas as exclusões pedem confirmação).

## 🔧 Changelog

### v3.6
- O atalho `Alt + Q` abre o widget e alterna entre minimizar e restaurar; `Alt + W` fecha ou reabre o widget preservando o estado.
- O cadastro de mensagens agora separa a escolha da tag em uma segunda etapa dentro do widget, oferecendo seleção de tags existentes ou criação de uma nova.
- Corrigidos preenchimento no campo ativo, importação com IDs únicos, sincronização entre abas, persistência de rascunhos e isolamento visual do widget.

### v3.5
- Adicionados tooltips (dica ao passar o mouse) em todos os botões de ação do card: favoritar, editar texto, editar categoria e apagar.
- Padronizada a cor do hover da estrela de favoritos para dourado, igual ao estado "já favoritado" (antes ficava azul).
- Aumentada a opacidade padrão dos ícones de ação quando inativos, melhorando a visibilidade em telas com brilho mais baixo.
- O menu da engrenagem agora pausa o fechamento automático (15s) enquanto o mouse está sobre as opções, fechando só quando o usuário realmente se afasta.
- Adicionado destaque visual (highlight) no trecho de texto encontrado pela busca, atualizado em tempo real conforme o usuário digita.
- Adicionada sincronização entre abas: alterações feitas em uma aba (editar, apagar, favoritar) refletem automaticamente em outras abas abertas com o widget, sem precisar recarregar a página.
- Adicionado "Desfazer" ao apagar uma mensagem individual: uma barra exibe a opção de desfazer por 20 segundos para restaurar a mensagem.
- Adicionado aviso de confirmação ao clicar em "Cancelar" no formulário com texto não salvo (novo ou diferente do original, em caso de edição), evitando perda acidental de texto.
- Substituído o `prompt()` de escolha ao importar por um modal com botões "Mesclar", "Substituir Tudo" e "Cancelar", eliminando a necessidade de digitar 1 ou 2. A opção de mesclar soma o backup importado às mensagens atuais, gerando novos IDs automaticamente em caso de conflito.
- Adicionado modo de seleção em lote: um botão "Selecionar Mensagens" dentro do menu da engrenagem ativa checkboxes nos cards, permitindo selecionar várias mensagens específicas para apagar ou exportar de uma vez (com "Selecionar Tudo" para marcar todas as visíveis no filtro atual).
- Adicionado skeleton de carregamento (blocos "pulsando") enquanto as mensagens são carregadas do armazenamento, no lugar de uma lista em branco por um instante.
- Adicionado destaque de borda no card que está sendo editado, deixando claro qual mensagem o formulário está alterando.
- Corrigido bug em que o clique em "Importar" fechava o menu da engrenagem imediatamente ao abrir o seletor de arquivo, em vez de fechar somente após a importação ser concluída.
- Corrigida limpeza de seleções "órfãs": se uma categoria inteira (ou todas as mensagens) for apagada enquanto havia itens marcados no modo de seleção em lote, a contagem de selecionados agora se ajusta automaticamente.
- Ícones do pacote da extensão (16, 32, 48 e 128px) redesenhados para melhor legibilidade nos tamanhos pequenos.

### v3.4
- Corrigido conflito entre `min-height`/`min-width` da regra base e o estado minimizado, que impedia o widget de encolher corretamente ao minimizar.
- Corrigido o estado minimizado para manter a largura ajustada pelo usuário, em vez de forçar uma largura fixa.
- Adicionada animação suave de altura ao minimizar/maximizar o widget.
- Adicionado campo de busca por texto na lista de mensagens.
- Adicionada aba de mensagens **Recentes** (últimas 5 inseridas).
- Adicionado contador de mensagens por tag nos filtros, com cor própria por tag para identificação visual mais rápida.
- Adicionada confirmação visual (destaque verde) no card ao inserir uma mensagem com sucesso.
- Adicionado estado vazio orientativo quando não há mensagens ou nenhum resultado bate com o filtro/busca.
- Adicionada persistência de posição e tamanho do widget entre recarregamentos de página.
- Adicionada scrollbar customizada (vertical na lista e horizontal nos filtros), alinhada ao tema escuro.
- Corrigido uso de `innerHTML` com texto do usuário nos cards (agora usa `textContent`), evitando que caracteres como `<` ou `>` quebrem a exibição.
- Adicionada validação de estrutura ao importar backup, evitando mensagens corrompidas ou IDs duplicados.
- Adicionado atalho `Alt + N` para abrir o widget direto no formulário de nova mensagem.
- Redesenhado o botão de incluir mensagem: visual mais discreto e profissional (contorno em vez de bloco cheio), com largura ajustada ao conteúdo. O botão SALVAR/ATUALIZAR do formulário passou a usar o mesmo estilo.
- Adicionado menu de backup via ícone de engrenagem ao lado do botão de incluir mensagem, evitando ocupar espaço fixo na tela. O menu fecha automaticamente ao clicar fora dele, após 15 segundos de inatividade, ou assim que uma exportação/importação é concluída com sucesso.
- Adicionada opção de apagar todas as mensagens salvas ou apagar mensagens por categoria, ambas com confirmação obrigatória informando quantos itens serão afetados. A seleção de categoria usa um dropdown discreto e rolável, preparado para lidar com muitas tags sem poluir a tela.
- Corrigido conflito entre o campo de busca do widget e o seletor que localiza o campo de busca do próprio site (ambos usavam `placeholder*="Buscar"`), que podia levar o preenchimento a cair no campo errado.
- Código reorganizado em funções menores e mais específicas, facilitando manutenção futura.

### v3.3
- Adicionada reordenação de mensagens por arraste (drag and drop). Qualquer card pode ser arrastado para reorganizar a lista.
- Reordenação respeita o agrupamento de favoritas: elas seguem fixadas no topo, mas a ordem dentro de cada grupo (favoritas e não favoritas) pode ser ajustada livremente.

### v3.2
- Adicionado suporte ao domínio `*.desk.blip.ai`.
- Adicionado redimensionamento vertical (topo e rodapé), além do já existente horizontal.
- Corrigida permissão `scripting` ausente no manifest, que impedia a injeção do widget quando a extensão era aberta pela primeira vez em uma aba.
- Corrigido comportamento em que o widget não abria no primeiro clique após a injeção do script, exigindo um segundo clique.
- Corrigido vazamento de listener de `mouseup` durante o redimensionamento lateral.
## Verificação local

Os testes usam dados fictícios e não acessam ASC/Blip.

- Sintaxe: `node --check content.js` e `node --check background.js`.
- Persistência: `node --test tests/storage.test.cjs` (Node.js com suporte a `node:test`).
- Interface isolada: `node tests/browser.cjs` (Playwright e Microsoft Edge instalados). Se Playwright não estiver na resolução padrão do Node, defina `PLAYWRIGHT_MODULE` com o caminho do módulo.

Os testes de interface simulam as APIs da extensão. A integração com o DOM e os eventos dos chats reais precisa ser verificada separadamente em ambiente autorizado.

As gravações de mensagens são serializadas pelo service worker. Mudanças em mensagens ou campos diferentes são preservadas; alterações concorrentes no mesmo campo seguem a última gravação. “Substituir Tudo” substitui deliberadamente a lista inteira. Falhas de gravação são informadas e o rascunho do formulário é preservado.
