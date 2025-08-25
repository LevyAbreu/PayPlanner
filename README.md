# PayPlanner

Um aplicativo web moderno para gerenciamento de dívidas e finanças pessoais, desenvolvido com Firebase para autenticação e armazenamento de dados.

## 📋 Funcionalidades

- **Autenticação de Usuários**: Sistema de login seguro com Firebase Auth
- **Dashboard Financeiro**: Visão geral das finanças com métricas importantes
- **Gestão de Dívidas**: 
  - Adicionar novas dívidas
  - Editar dívidas existentes
  - Excluir dívidas
  - Filtrar por status (todas, pagas, em pagamento, pendentes, vencidas)
- **Resumo Financeiro**:
  - Total de dívidas
  - Valor pago
  - Valor pendente
  - Valor vencido
- **Interface Responsiva**: Design adaptável para desktop e dispositivos móveis

## 🛠️ Tecnologias Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Firebase (Firestore, Authentication)
- **Deploy**: Hospedagem estática (GitHub Pages, Vercel)

## 📦 Estrutura do Projeto

```
payplanner/
├── pages 
│   ├── index.html
│   └── signup.html
├── style/
│   ├── login.css 
│   └── style.css
├── script/
│   ├── login.js
│   └── main.js
│   └── signup.js
└── login.html
```

## 📱 Como Usar

1. **Cadastro e Login**
   - Acesse a aplicação
   - Faça login com suas credenciais
   - Crie uma conta se for preciso

2. **Adicionar Dívidas**
   - Clique no botão "Adicionar Dívida"
   - Preencha os detalhes: nome, valor, status e data de vencimento
   - Clique em "Salvar Dívida"

3. **Gerenciar Dívidas**
   - Use os filtros para visualizar dívidas por status
   - Edite dívidas clicando no ícone de lápis
   - Exclua dívidas clicando no ícone de lixeira

4. **Acompanhar seu Progresso**
   - Visualize o resumo financeiro no topo da página
   - Monitore dívidas próximas do vencimento ou vencidas

## 🎨 Personalização

Você pode personalizar facilmente a aparência da aplicação editando o arquivo `style.css`. As cores principais são definidas usando variáveis CSS que podem ser modificadas para alterar o tema completo.

## 🔒 Segurança

- Todas as operações de banco de dados são validadas pelas regras de segurança do Firebase
- Cada usuário só pode acessar suas próprias dívidas
- Dados sensíveis são protegidos pelas políticas de segurança do Firebase

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 🤝 Contribuindo

Contribuições são sempre bem-vindas! Sinta-se à vontade para:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📞 Suporte

Se você tiver alguma dúvida ou problema, sinta-se à vontade para abrir uma issue no repositório.

---

**Nota**: Este projeto é para fins educacionais e pode precisar de ajustes adicionais para uso em produção.