# Mensagens Rápidas 🚀

**Mensagens Rápidas** é uma extensão desenvolvida para otimizar o atendimento no SAC Messenger da ASC Brazil e no chat da Cilia. Ela permite gerenciar, favoritar e inserir mensagens pré-definidas instantaneamente nos campos de chat ou busca, eliminando a digitação repetitiva.

## ✨ Funcionalidades

- **Widget Flutuante**: Interface moderna, semi-transparente e com efeito de vidro (blur), que pode ser movida e redimensionada na tela.
- **Redimensionamento Total**: Ajuste a largura pelas laterais e a altura pelo topo e rodapé do widget.
- **Método Nuclear de Preenchimento**: Algoritmo robusto que localiza campos de texto mesmo dentro de múltiplos iFrames, limpando o campo antes da inserção para evitar erros.
- **Trava Anti-Duplicidade**: Sistema de controle de fluxo que impede a inserção duplicada de mensagens em cliques rápidos ou instabilidades do site.
- **Categorização por Tags**: Organize suas mensagens por categorias (Ex: GERAL, FINANCEIRO, SUPORTE).
- **Sistema de Favoritos**: Marque as mensagens mais usadas com uma estrela (que brilha em amarelo quando ativa) para que fiquem no topo da lista.
- **Reordenação por Arraste**: Clique e arraste qualquer card para reorganizar suas mensagens na ordem que preferir. Favoritas continuam fixadas no topo, mas podem ser reordenadas entre si, assim como as demais.
- **Filtros Ágeis**: Filtre rapidamente por tags ou veja apenas as favoritadas.
- **Backup**: Exporte e importe suas mensagens em formato JSON.
- **Atalho de Teclado**: Abra ou feche o widget instantaneamente usando `Alt + Q`.

## 🌐 Domínios Suportados

- `*.ascbrazil.com.br` (SAC Messenger)
- `*.blip.ai` (Chat Blip)

## 🛠️ Tecnologias Utilizadas

- **JavaScript (ES6+)**: Lógica principal e manipulação de DOM.
- **Chrome Extension API (Manifest v3)**: Estrutura moderna para extensões de navegador.
- **CSS3**: Estilização avançada com animações e filtros de Backdrop.
- **Chrome Storage Local**: Persistência de dados das mensagens no navegador.

## 🚀 Como Instalar (Modo Desenvolvedor)

1. Faça o download ou clone este repositório.
2. Abra o Microsoft Edge (ou Chrome) e acesse `edge://extensions` (ou `chrome://extensions`).
3. Ative o **Modo do desenvolvedor** no canto inferior esquerdo.
4. Clique em **Carregar descompactada** e selecione a pasta onde estão os arquivos do projeto.
5. A extensão aparecerá no seu navegador. Acesse o domínio da ASC Brazil ou da Cilia e clique no ícone ou use `Alt + Q`.

## 📌 Uso

1. Clique em **+ INCLUIR MENSAGEM** para cadastrar seus textos.
2. Defina uma **Tag** para organizar a mensagem.
3. Para usar: **Clique primeiro no campo de texto** (onde você digita no chat ou na barra de busca) e depois clique na mensagem desejada dentro do widget.
4. Para redimensionar, arraste qualquer uma das quatro bordas do widget.
5. Para reordenar, clique e arraste o card da mensagem para a posição desejada.

## 🔧 Changelog

### v3.3
- Adicionada reordenação de mensagens por arraste (drag and drop). Qualquer card pode ser arrastado para reorganizar a lista.
- Reordenação respeita o agrupamento de favoritas: elas seguem fixadas no topo, mas a ordem dentro de cada grupo (favoritas e não favoritas) pode ser ajustada livremente.

### v3.2
- Adicionado suporte ao domínio `*.desk.blip.ai`.
- Adicionado redimensionamento vertical (topo e rodapé), além do já existente horizontal.
- Corrigida permissão `scripting` ausente no manifest, que impedia a injeção do widget quando a extensão era aberta pela primeira vez em uma aba.
- Corrigido comportamento em que o widget não abria no primeiro clique após a injeção do script, exigindo um segundo clique.
- Corrigido vazamento de listener de `mouseup` durante o redimensionamento lateral.

