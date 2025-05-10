# Usando uma imagem base com Node.js
FROM node:16

# Instala o Xvfb e o Chrome
RUN apt-get update && apt-get install -y \
  wget \
  curl \
  xvfb \
  google-chrome-stable

# Copiar arquivos do seu projeto para o container
WORKDIR /app
COPY . .

# Instalar dependências
RUN npm install

# Configuração para iniciar o Xvfb e o Chrome, e rodar o seu app
CMD xvfb-run --auto-servernum --server-args="-screen 0, 1024x768x24" google-chrome-stable --headless --no-sandbox --disable-gpu && npm start
