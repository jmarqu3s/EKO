# EKO
EKO é uma aplicação web que transforma qualquer playlist pública do YouTube em uma experiência de reprodução limpa e sem distrações, focada em música.

Funcionalidades
Player

Reprodução de playlists do YouTube via link
Fila de faixas com navegação, shuffle e repetição de playlist
Barra de progresso interativa com arraste para buscar posição
Controles por teclado: Espaço para pausar/retomar, → avança 10s, ← volta 10s
Continua automaticamente de onde você parou ao reabrir uma playlist
Busca dentro da fila para filtrar faixas em tempo real
Remoção de faixas da fila sem alterar a playlist original
Conta de usuário

Cadastro e login com autenticação segura
Histórico de playlists e vídeos assistidos
Salvar playlists com nome personalizado para acesso rápido
Sincronização da playlist para refletir alterações feitas no YouTube
Tecnologias
Camada	Tecnologia
Backend	Java 21 · Spring Boot · Spring Security
Frontend	Thymeleaf · JavaScript · CSS
Banco de dados	PostgreSQL
API externa	YouTube Data API v3
Como executar
Pré-requisitos: Java 21, PostgreSQL, chave da YouTube Data API v3


# Clone o repositório
git clone https://github.com/seu-usuario/projetoEKO.git

# Configure as variáveis em src/main/resources/application.properties
spring.datasource.url=jdbc:postgresql://localhost:5432/eko
spring.datasource.username=seu_usuario
spring.datasource.password=sua_senha
youtube.api.key=sua_chave_api

# Execute
./mvnw spring-boot:run
Acesse em http://localhost:8080

Projeto desenvolvido com fins de aprendizado e uso pessoal.
