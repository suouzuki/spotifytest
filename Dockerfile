# Usar a imagem base Node.js 22 slim
FROM node:22-slim

# Instalar dependências necessárias para o Google Chrome e Xvfb
RUN apt-get update && apt-get install -y \
  wget \
  curl \
  gnupg2 \
  ca-certificates \
  libxss1 \
  libappindicator3-1 \
  fonts-liberation \
  libappindicator1 \
  libnss3 \
  libx11-xcb1 \
  libgbm1 \
  xvfb \  # Instalação do Xvfb
  && wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add - \
  && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list \
  && apt-get update \
  && apt-get install -y google-chrome-stable --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

# Verificar a instalação do Google Chrome e do Xvfb
RUN which google-chrome-stable && which google-chrome && which Xvfb

# Diretório de trabalho
WORKDIR /app

# Copiar arquivos da aplicação
COPY . .

# Instalar dependências do Node.js
RUN npm install

# Criar diretório de downloads
RUN mkdir -p ./downloads

# Comando para rodar a aplicação
CMD ["npm", "start"]
