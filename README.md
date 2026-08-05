# Mensagens Rápidas 🚀

**Mensagens Rápidas** é uma extensão desenvolvida para otimizar o atendimento no SAC Messenger da ASC Brazil e no chat do Blip. Ela permite gerenciar, favoritar e inserir mensagens pré-definidas instantaneamente nos campos de chat ou busca, eliminando a digitação repetitiva.

## ✨ Funcionalidades

- **Widget Flutuante**: Interface moderna, semi-transparente e com efeito de vidro (blur), que pode ser movida e redimensionada na tela.
- **Redimensionamento Total**: Ajuste a largura pelas laterais e a altura pelo topo e rodapé do widget. O tamanho e a posição ficam salvos e são restaurados mesmo depois de recarregar a página.
- **Busca por Texto**: Filtre a lista de mensagens digitando um trecho do texto, além do filtro por tag.
- **Método Nuclear de Preenchimento**: Algoritmo robusto que localiza campos de texto mesmo dentro de múltiplos iFrames, limpando o campo antes da inserção para evitar erros.
- **Trava Anti-Duplicidade**: Sistema de controle de fluxo que impede a inserção duplicada de mensagens em cliques rápidos ou instabilidades do site.
- **Confirmação Visual**: Ao inserir uma mensagem, o card pisca em verde por um instante confirmando que o texto foi enviado ao campo.
- **Categorização por Tags**: Organize suas mensagens por categorias (Ex: GERAL, FINANCEIRO, SUPORTE), cada uma com uma cor própria para identificação rápida.
- **Contador por Categoria**: Cada filtro de tag mostra quantas mensagens existem naquela categoria.
- **Sistema de Favoritos**: Marque as mensagens mais usadas com uma estrela (que brilha em amarelo quando ativa) para que fiquem no topo da lista.
- **Aba de Recentes**: Acesse rapidamente as últimas 5 mensagens que você inseriu, sem precisar procurar na lista.
- **Reordenação por Arraste**: Clique e arraste qualquer card para reorganizar suas mensagens na ordem que preferir. Favoritas continuam fixadas no topo, mas podem ser reordenadas entre si, assim como as demais.
- **Filtros Ágeis**: Filtre rapidamente por tags, veja apenas as favoritadas ou as recentes.
- **Menu de Backup**: Um ícone de engrenagem ao lado do botão de incluir mensagem abre um menu compacto com todas as ações de backup, sem ocupar espaço permanente na tela.
  - **Exportar / Importar**: Salve todas as mensagens em um arquivo JSON ou restaure a partir de um backup. A importação valida a estrutura do arquivo antes de aplicar, evitando dados corrompidos.
  - **Apagar Categoria**: Um dropdown discreto e rolável lista todas as tags com a quantidade de mensagens de cada uma. Clicar em uma tag apaga só as mensagens daquela categoria, sempre pedindo confirmação antes.
  - **Apagar Tudo**: Remove todas as mensagens salvas de uma vez, também com confirmação obrigatória informando o total que será apagado.
- **Estado Vazio Orientativo**: Quando não há mensagens cadastradas ou nenhuma bate com o filtro/busca, o widget mostra uma mensagem explicando o que fazer.
- **Atalhos de Teclado**: `Alt + Q` abre ou fecha o widget instantaneamente. `Alt + N` abre o widget direto no formulário de nova mensagem.

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
2. Defina uma **Tag** para organizar a mensagem.
3. Para usar: **Clique primeiro no campo de texto** (onde você digita no chat ou na barra de busca) e depois clique na mensagem desejada dentro do widget.
4. Para encontrar uma mensagem rapidamente, use o campo de busca ou os filtros de tag/favoritos/recentes no topo da lista.
5. Para redimensionar, arraste qualquer uma das quatro bordas do widget. O tamanho e a posição ficam salvos automaticamente.
6. Para reordenar, clique e arraste o card da mensagem para a posição desejada.
7. Para fazer backup ou apagar mensagens, clique no ícone de engrenagem (⚙) ao lado de "Incluir Mensagem". Lá você encontra Exportar, Importar, Apagar Categoria (com confirmação) e Apagar Tudo (com confirmação).

## 🔧 Changelog

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
- Adicionado menu de backup via ícone de engrenagem ao lado do botão de incluir mensagem, evitando ocupar espaço fixo na tela. O menu fecha automaticamente ao clicar fora dele.
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

