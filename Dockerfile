# Usando uma imagem base do Node.js (Debian/Ubuntu)
FROM node:22

# Instalando dependências do sistema para Xvfb e Google Chrome
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    xvfb \
    gnupg2 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Adicionando o repositório oficial do Google Chrome
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | tee -a /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update

# Instalando o Google Chrome
RUN apt-get install -y google-chrome-stable

# Definindo diretório de trabalho dentro do container
WORKDIR /app

# Copiar os arquivos de dependências
COPY package.json package-lock.json ./

# Instalar dependências (apenas de produção)
RUN npm install --production

# Copiar o restante dos arquivos do projeto
COPY . .

# Definir a variável de ambiente para o Chrome
ENV CHROME_PATH="/usr/bin/google-chrome"

# Expor a porta da aplicação
EXPOSE 3000

# Comando para rodar a aplicação
CMD ["npm", "run", "start"]
