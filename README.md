# PROPOSTA LEGAL - Gerador de Orçamentos com IA

Esta é uma aplicação web para gerar propostas comerciais inteligentes, utilizando a API do Google Gemini para criar textos persuasivos e personalizados.

## Funcionalidades

- Formulário detalhado para inserção de dados do cliente e itens do orçamento.
- Cálculo automático de totais, subtotais e descontos.
- Geração de texto da proposta utilizando IA (Google Gemini).
- Exportação da proposta final para os formatos PDF e Word (.docx).
- Arquitetura segura com backend proxy para proteger a chave da API.

---

## Desenvolvimento Local

Para rodar o projeto no seu computador, você precisará simular o ambiente da Vercel para que a função da API (`/api/generate`) funcione corretamente. A forma mais fácil é usando a Vercel CLI.

### Pré-requisitos

1.  **Node.js:** Tenha o Node.js instalado. Você pode baixá-lo em [nodejs.org](https://nodejs.org/).
2.  **Vercel CLI:** Instale a Command Line Interface (CLI) da Vercel globalmente no seu computador. Abra seu terminal e rode:
    ```bash
    npm install -g vercel
    ```

### Passos para Rodar Localmente

1.  **Login na Vercel:**
    Autentique-se na sua conta da Vercel pelo terminal:
    ```bash
    vercel login
    ```

2.  **Clone o Repositório:**
    Se ainda não fez, clone o repositório do GitHub para sua máquina e entre na pasta do projeto.
    ```bash
    git clone https://github.com/TESTEPDVLEGAL/Propostalegal.git
    cd Propostalegal
    ```
    
3.  **Instale as Dependências:**
    A função da API precisa de pacotes externos. Rode o seguinte comando na raiz do projeto para instalá-los:
    ```bash
    npm install
    ```
    Isso criará uma pasta `node_modules` com as bibliotecas necessárias para o backend. Você só precisa fazer isso uma vez.

4.  **Crie o Arquivo de Ambiente:**
    - Crie um arquivo chamado `.env.local` na raiz do projeto.
    - Dentro deste arquivo, adicione sua chave de API (substitua o texto de exemplo pela sua chave real):
      ```
      API_KEY="SUA_CHAVE_SECRETA_DO_GEMINI_AQUI"
      ```
    - **Importante:** Este arquivo já está no `.gitignore` e não será enviado para o GitHub, mantendo sua chave segura.

5.  **Inicie o Servidor de Desenvolvimento:**
    No terminal, dentro da pasta do projeto, execute o comando:
    ```bash
    vercel dev
    ```

6.  **Acesse a Aplicação:**
    A Vercel CLI iniciará um servidor local. A aplicação estará disponível em `http://localhost:3000`. O terminal mostrará o endereço exato.

Agora você pode fazer alterações no código e ver os resultados em tempo real no seu navegador.

---

## Publicação Online (Deploy) na Vercel

Siga estes passos para publicar sua aplicação de forma gratuita e segura na Vercel.

### Pré-requisitos

1.  **Conta no GitHub:** Necessária para hospedar o código. Se não tiver, crie uma em [github.com](https://github.com).
2.  **Conta na Vercel:** Necessária para a publicação. Se não tiver, crie uma em [vercel.com](https://vercel.com) (você pode usar sua conta do GitHub para se registrar).
3.  **Sua Chave de API do Gemini:** Você já tem a chave que será usada.

### Passo a Passo para o Deploy

#### 1. Envie o Código para o GitHub

- Crie um novo repositório no seu GitHub (pode ser público ou privado).
- Siga as instruções do GitHub para enviar todos os arquivos do projeto para este novo repositório.

#### 2. Importe o Projeto na Vercel

- Faça login na sua conta da Vercel.
- No seu painel (Dashboard), clique em **"Add New..."** e selecione **"Project"**.
- A Vercel irá mostrar seus repositórios do GitHub. Encontre e clique em **"Import"** no repositório `PROPOSTA LEGAL` que você acabou de criar.

#### 3. Configure o Projeto

- A Vercel detectará automaticamente o `package.json` e as configurações de build. Você não precisa mudar nada aqui.
- Abra a seção **"Environment Variables"** (Variáveis de Ambiente).
- Adicione uma nova variável:
  - **Name:** `API_KEY`
  - **Value:** Cole aqui a sua chave secreta da API do Gemini.
- **Importante:** Certifique-se de que a variável não esteja marcada como "Exposed to the browser". A Vercel já faz isso por padrão para projetos com backend.

#### 4. Publique!

- Clique no botão **"Deploy"**.
- A Vercel irá instalar as dependências, construir e publicar sua aplicação. Em poucos minutos, você receberá um link público (ex: `proposta-legal.vercel.app`) onde sua aplicação estará funcionando online.

Pronto! Sua aplicação está no ar, e sua chave de API está segura no servidor da Vercel.