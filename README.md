# Explore Vitória

Guia digital de turismo para descobrir Vitória e o litoral do Espírito Santo. O site reúne informações sobre praias, gastronomia, cultura, lazer e experiências locais, além de uma interface de chat para montar roteiros com IA.

## Funcionalidades

- Página inicial com apresentação do guia e conteúdo multimídia.
- Páginas institucionais **Sobre Nós** e **Fale Conosco**.
- Página **Mochilão**, com chat para solicitar roteiros personalizados.
- Seis páginas de temas turísticos: aventura e natureza, compras e artesanato, gastronomia capixaba, história e cultura, praias e litoral, e vida noturna e lazer.
- Componentes HTML compartilhados, como cabeçalho, rodapé, contato e parceiros, carregados pelo JavaScript do site.
- Formulário de contato integrado a uma API Express e a um banco MySQL.

## Tecnologias

- HTML, CSS e JavaScript no site.
- Bootstrap 5.3 carregado por CDN.
- Node.js, Express 5, `mysql2`, `cors` e `dotenv` no servidor de contato.
- MySQL para armazenar contatos.
- API do Google Gemini para gerar roteiros por meio da função em `api/chat.js`.
- SCSS disponível em `assets/scss/`; o site referencia o CSS compilado em `assets/css/main.css`.

## Estrutura do projeto

```text
.
├── api/chat.js                 # Função HTTP serverless para o chat com Gemini
├── assets/
│   ├── css/main.css            # CSS utilizado pelas páginas
│   ├── img/                    # Imagens e outros recursos visuais
│   ├── js/main.js              # Carregamento de componentes e interações
│   └── scss/                   # Fontes SCSS dos estilos
├── bd/Dump20260927/            # Dumps SQL das tabelas do banco
├── components/                 # Trechos HTML compartilhados
├── solucoes/                   # Páginas por tema turístico
├── src/
│   ├── package.json            # Dependências do servidor Node.js
│   └── server.js               # API Express de contato
├── fale-conosco.html
├── index.html
├── mochilao.html
└── sobre.html
```

## Executar localmente

### 1. Preparar o banco e o servidor de contato

É necessário ter Node.js/npm e MySQL instalados e em execução. Crie o banco de dados `explore_vitoria` no MySQL. O servidor cria a tabela `contatos_viagem` ao iniciar, desde que consiga se conectar ao banco.

No terminal, a partir da raiz do projeto:

```powershell
cd src
npm install
```

Crie `src/.env` com os dados da sua instalação local do MySQL:

```dotenv
PORT=3000
DB_HOST=localhost
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=explore_vitoria
```

Inicie a API:

```powershell
node server.js
```

O servidor ficará disponível em `http://localhost:3000`. O endpoint `POST /api/contato` exige `nome`, `email` e `telefone`; `mensagem` é opcional.

### 2. Servir o site

Sirva a pasta raiz com uma extensão de servidor estático do VS Code, como Live Server. Abra `index.html` pelo servidor, não diretamente como arquivo local: as páginas carregam componentes HTML usando `fetch`, que requer uma origem HTTP.

O formulário de contato espera que a API local esteja em `http://localhost:3000`.

### 3. Configurar a IA

`api/chat.js` exporta uma função HTTP serverless para `POST /api/chat`. Ela recebe `{ "message": "..." }`, exige a variável `GEMINI_API_KEY` no ambiente de execução e retorna `{ "resposta": "..." }`.

O projeto não inclui uma rota `/api/chat` no servidor Express local de `src/server.js`. Portanto, iniciar apenas esse servidor não habilita o chat com IA. Para usá-lo, publique a função em um ambiente compatível com funções serverless e configure a chave Gemini nesse ambiente; em produção, o site espera a rota `/api/chat` na mesma origem. Não coloque a chave da API no JavaScript do navegador.

## Banco de dados

Os arquivos em `bd/Dump20260927/` contêm dumps SQL separados para `categorias`, `contatos_viagem`, `explore_vitoria` e `locais`. A importação dos dumps é opcional para executar o servidor de contato: ele cria `contatos_viagem` se ela ainda não existir.

Os dumps contêm comandos `DROP TABLE` e podem substituir tabelas existentes. Faça backup e confira o conteúdo antes de importá-los, especialmente em um banco que já tenha dados que você queira preservar.

## Endpoints

| Método | Caminho | Uso |
| --- | --- | --- |
| `POST` | `/api/contato` | Valida os campos obrigatórios e grava um contato em `contatos_viagem`. Implementado em `src/server.js`. |
| `POST` | `/api/chat` | Recebe uma mensagem e solicita um roteiro ao Gemini. Implementado em `api/chat.js` para execução serverless. |

## Observações

- As dependências Node estão em `src/package.json`; não há script `start` definido, então o servidor é iniciado com `node server.js` dentro de `src`.
- O site carrega Bootstrap de um CDN, portanto precisa de acesso à internet para obter esse recurso.
- A integração do chat depende de uma chave Gemini válida e da disponibilidade dos modelos configurados na função.
