# Usando uma imagem base do Node.js (Debian/Ubuntu)
FROM node:22

# Instalando dependências do sistema para Xvfb e Google Chrome
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    xvfb \
    google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

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
