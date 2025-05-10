FROM node:22-slim

# Variável para não travar em perguntas interativas
ENV DEBIAN_FRONTEND=noninteractive

# Instala dependências e o Chrome
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libgtk-3-0 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxrandr2 \
    libxss1 \
    libgdk-pixbuf2.0-0 \
    libgbm1 \
    xdg-utils \
    xvfb \
    --no-install-recommends && rm -rf /var/lib/apt/lists/*

# Adiciona o repositório do Google Chrome e instala o Chrome
RUN wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add - && \
    echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list && \
    apt-get update && apt-get install -y google-chrome-stable --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Cria pasta de trabalho
WORKDIR /app

# Copia arquivos
COPY . .

# Instala dependências do Node.js
RUN npm install

# Mostra caminho do Chrome instalado
RUN which google-chrome

# Executa app
CMD ["npm", "run", "start"]
