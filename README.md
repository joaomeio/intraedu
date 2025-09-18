# IntraEdu

**IntraEdu** é uma aplicação web de chat destinada ao ambiente escolar.  
O objetivo é fornecer aos estudantes, professores e colaboradores uma forma simples e instantânea de trocar mensagens entre si dentro da mesma instituição.  

## Funcionalidades principais

* **Cadastro e Login**: criação de contas usando e‑mail e senha e login seguro via [Firebase Authentication](https://firebase.google.com/docs/auth).  
* **Lista de usuários**: exibe todos os usuários cadastrados (exceto o usuário atual) para iniciar conversas.  
* **Mensagens em tempo real**: envio e recepção de mensagens de texto em tempo real usando [Cloud Firestore](https://firebase.google.com/docs/firestore). As mensagens ficam organizadas em canais privados entre dois usuários.  
* **Design moderno**: interface leve e responsiva, inspirada em aplicativos de mensagens atuais, com paleta de cores em azul escuro, verde e branco e tipografia limpa.

## Pré‑requisitos

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/) e habilite **Authentication (Email/Password)** e **Cloud Firestore**.  
2. No painel do Firebase, em **Project settings → General**, gere um novo **App Web** e copie as credenciais (apiKey, authDomain, projectId, etc.).  
3. No Firestore, crie as coleções `users` e `messages` (os documentos são gerados automaticamente pelo código).  
4. Substitua os valores do objeto `firebaseConfig` em `app.js` pelos dados do seu projeto.

## Como executar

1. Clone ou faça o download deste repositório.  
2. Abra o arquivo `index.html` em um navegador moderno.  
3. Preencha as credenciais do Firebase em `app.js` e atualize a página.  
4. Registre um novo usuário para começar a usar.

## Deploy no GitHub Pages

Para publicar no GitHub Pages, basta criar um repositório (por exemplo `intraedu`) no GitHub, fazer commit de todos os arquivos e habilitar o GitHub Pages na branch principal. O site ficará disponível em `https://seu_usuario.github.io/intraedu/`.

## Observações

* Este projeto utiliza o SDK modular do Firebase carregado via CDN. Caso prefira usar um gerenciador de pacotes, adapte os imports em `app.js` conforme a [documentação oficial](https://firebase.google.com/docs/web/learn-more#modular).
* O código foi desenvolvido para fins educacionais. Para uso em produção é recomendável implementar controles adicionais (validação de dados, sanitização de mensagens, paginação de históricos, etc.).
