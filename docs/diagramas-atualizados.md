# Diagramas atualizados - Library Box

## Modelo Entidade-Relacionamento

```mermaid
erDiagram
    USERS ||--o{ RESERVATIONS : realiza
    BOOKS ||--o{ RESERVATIONS : recebe
    USERS ||--o{ COMMENTS : escreve
    BOOKS ||--o{ COMMENTS : possui
    USERS ||--o{ BOOK_INTERACTIONS : registra
    BOOKS ||--o{ BOOK_INTERACTIONS : recebe

    USERS {
        int id PK
        varchar name
        varchar email UK
        varchar password
        varchar role
        varchar status
    }

    BOOKS {
        int id PK
        varchar title
        varchar author
        varchar category
        varchar status
    }

    RESERVATIONS {
        int id PK
        int user_id FK
        int book_id FK
        varchar status
        timestamp created_at
    }

    BOOK_INTERACTIONS {
        int id PK
        int user_id FK
        int book_id FK
        tinyint liked
        tinyint favorite
        int rating
        timestamp updated_at
    }

    COMMENTS {
        int id PK
        int user_id FK
        int book_id FK
        varchar message
        timestamp created_at
    }

    FEED_POSTS {
        int id PK
        varchar title
        varchar message
        varchar type
        timestamp created_at
    }

    CONTACT_MESSAGES {
        int id PK
        varchar name
        varchar email
        varchar subject
        varchar message
        timestamp created_at
    }
```

## Modelo Logico do Banco

```mermaid
flowchart TD
    users["users<br/>id PK<br/>name<br/>email UNIQUE<br/>password<br/>role<br/>status"]
    books["books<br/>id PK<br/>title<br/>author<br/>category<br/>status"]
    reservations["reservations<br/>id PK<br/>user_id FK<br/>book_id FK<br/>status<br/>created_at"]
    interactions["book_interactions<br/>id PK<br/>user_id FK<br/>book_id FK<br/>liked<br/>favorite<br/>rating<br/>updated_at<br/>UNIQUE user_id + book_id"]
    comments["comments<br/>id PK<br/>user_id FK<br/>book_id FK<br/>message<br/>created_at"]
    feed["feed_posts<br/>id PK<br/>title<br/>message<br/>type<br/>created_at"]
    contact["contact_messages<br/>id PK<br/>name<br/>email<br/>subject<br/>message<br/>created_at"]

    users --> reservations
    books --> reservations
    users --> interactions
    books --> interactions
    users --> comments
    books --> comments
```

## Diagrama de Classes

```mermaid
classDiagram
    class Usuario {
        +id: int
        +nome: string
        +email: string
        +senha: string
        +perfil: string
        +status: string
        +realizarLogin()
        +solicitarReserva()
        +comentarLivro()
        +avaliarLivro()
    }

    class Administrador {
        +cadastrarLivro()
        +alterarLivro()
        +removerLivro()
        +gerenciarUsuario()
        +gerenciarReserva()
        +publicarAviso()
    }

    class Livro {
        +id: int
        +titulo: string
        +autor: string
        +categoria: string
        +status: string
        +alterarStatus()
    }

    class Reserva {
        +id: int
        +status: string
        +dataCriacao: date
        +concluir()
        +liberar()
        +cancelar()
    }

    class Comentario {
        +id: int
        +mensagem: string
        +dataCriacao: date
    }

    class InteracaoLivro {
        +id: int
        +curtido: boolean
        +favorito: boolean
        +avaliacao: int
        +registrarCurtida()
        +registrarFavorito()
        +registrarAvaliacao()
    }

    class AvisoFeed {
        +id: int
        +titulo: string
        +mensagem: string
        +tipo: string
        +dataCriacao: date
    }

    class MensagemContato {
        +id: int
        +nome: string
        +email: string
        +assunto: string
        +mensagem: string
        +dataCriacao: date
    }

    Administrador --|> Usuario
    Usuario "1" --> "0..*" Reserva
    Livro "1" --> "0..*" Reserva
    Usuario "1" --> "0..*" Comentario
    Livro "1" --> "0..*" Comentario
    Usuario "1" --> "0..*" InteracaoLivro
    Livro "1" --> "0..*" InteracaoLivro
```

## Diagrama de Caso de Uso Geral

```mermaid
flowchart LR
    visitante([Visitante])
    leitor([Usuario])
    admin([Administrador])

    subgraph sistema[Library Box]
        cadastro((Cadastrar conta))
        login((Realizar login))
        consultar((Consultar acervo))
        reservar((Reservar livro))
        comentar((Comentar e avaliar livro))
        favoritos((Curtir e favoritar))
        rankings((Consultar rankings))
        contato((Enviar contato))
        crudLivros((Gerenciar livros))
        crudUsuarios((Gerenciar usuarios))
        crudFeed((Gerenciar feed))
        reservas((Gerenciar reservas))
        moderar((Gerenciar comentarios))
        contatos((Consultar contatos))
    end

    visitante --> cadastro
    visitante --> consultar
    visitante --> rankings
    visitante --> contato
    visitante --> login

    leitor --> login
    leitor --> consultar
    leitor --> reservar
    leitor --> comentar
    leitor --> favoritos
    leitor --> rankings

    admin --> login
    admin --> crudLivros
    admin --> crudUsuarios
    admin --> crudFeed
    admin --> reservas
    admin --> moderar
    admin --> contatos
```

## Diagrama de Sequencia - Reserva de Livro

```mermaid
sequenceDiagram
    actor Usuario
    participant Tela as Pagina de reservas
    participant API as API Node.js
    participant DB as MySQL

    Usuario->>Tela: escolhe livro disponivel
    Tela->>API: POST /api/reservations
    API->>DB: grava reserva solicitada
    API->>DB: atualiza livro para Reservado
    DB-->>API: confirma operacao
    API-->>Tela: retorna reserva criada
    Tela-->>Usuario: atualiza lista de livros
```

## Diagrama de Sequencia - Comentario e Avaliacao

```mermaid
sequenceDiagram
    actor Usuario
    participant Tela as Pagina de comentarios
    participant API as API Node.js
    participant DB as MySQL

    Usuario->>Tela: seleciona livro
    Tela->>API: GET /api/comments?bookId
    API->>DB: consulta comentarios e avaliacao
    DB-->>API: retorna dados
    API-->>Tela: exibe comentarios
    Usuario->>Tela: envia comentario e estrelas
    Tela->>API: POST /api/books/:id/rating
    API->>DB: salva avaliacao
    Tela->>API: POST /api/comments
    API->>DB: salva comentario
    API-->>Tela: confirma cadastro
```

## Diagrama de Atividades - Fluxo de Reserva

```mermaid
flowchart TD
    inicio([Inicio]) --> login{Usuario logado?}
    login -- Nao --> entrar[Ir para login]
    entrar --> autenticar[Autenticar usuario]
    autenticar --> listar[Listar livros]
    login -- Sim --> listar
    listar --> escolher[Escolher livro disponivel]
    escolher --> confirmar[Confirmar reserva]
    confirmar --> salvar[Salvar reserva no banco]
    salvar --> status[Alterar status do livro para Reservado]
    status --> fim([Fim])
```

## Diagrama de Atividades - Administracao do Acervo

```mermaid
flowchart TD
    inicio([Inicio]) --> login[Login administrador]
    login --> painel[Abrir painel administrativo]
    painel --> acao{Escolher acao}
    acao --> cadastrar[Cadastrar livro]
    acao --> editar[Editar livro]
    acao --> excluir[Excluir livro]
    acao --> status[Alterar status do livro]
    cadastrar --> salvar[Gravar no MySQL]
    editar --> salvar
    excluir --> salvar
    status --> salvar
    salvar --> listar[Atualizar tabela de livros]
    listar --> fim([Fim])
```
