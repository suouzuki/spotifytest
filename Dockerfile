# Usando uma imagem base do Node.js (Debian/Ubuntu)
FROM node:22

# Instalando dependências do sistema para Xvfb e Google Chrome
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    xvfb \
    google-chrome-stable \
    libx11-xcb1 \
    libxcomposite1 \
    libxrandr2 \
    libgtk-3-0 \
    libnss3 \
    libasound2 \
    fonts-liberation \
    libappindicator3-1 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libgdk-pixbuf2.0-0 \
    libgbm1 \
    xdg-utils \
    --no-install-recommends && rm -rf /var/lib/apt/lists/*

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
