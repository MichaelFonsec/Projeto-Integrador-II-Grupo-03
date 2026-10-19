# ObraControl – Controle de Estoque

- [Introdução](#introdução)
- [Funcionalidades e Módulos](#funcionalidades-e-módulos)
  - [Dashboard (Business Intelligence)](#dashboard-business-intelligence)
  - [Fluxo Operacional de Estoque](#fluxo-operacional-de-estoque)
  - [Cadastro Automatizado (BrasilAPI)](#cadastro-automatizado-brasilapi)
  - [Persistência em Nuvem (Firebase)](#persistência-em-nuvem-firebase)
- [Arquitetura e Tecnologias](#arquitetura-e-tecnologias)
- [Ferramentas](#ferramentas)
- [Contribuição](#contribuição)

## Introdução

O **ObraControl** é uma aplicação web unificada desenvolvida para modernizar e otimizar o gerenciamento de estoque logístico em canteiros de obras. Criado para superar as limitações de sistemas informais e fragmentados, o projeto aplica o padrão de arquitetura MVC (Model-View-Controller) e a filosofia Mobile-First. O objetivo é registrar entradas e saídas de produtos com segurança, confiabilidade e alta disponibilidade, oferecendo uma experiência fluida tanto em computadores quanto em dispositivos móveis no campo.

## Funcionalidades e Módulos

### Dashboard (Business Intelligence)
O painel inicial atua como uma central de Business Intelligence em tempo real para os gestores da construtora. 

**Características:**
- Apresenta métricas críticas instantâneas, como capital imobilizado e alertas de estoque.
- Exibe gráficos analíticos (Consumo Real vs. Orçado, Fluxo de Movimentações, Curva ABC) utilizando a biblioteca `Chart.js`.
- Ajuda no planejamento preditivo para reposição de insumos.

### Fluxo Operacional de Estoque
Módulo responsável por cobrir o ciclo de vida completo dos materiais da construtora, substituindo a fragmentação de abas por uma interface coesa.

**Características:**
- Registro de entrada de mercadorias no almoxarifado central.
- Alocação direta em frentes de trabalho específicas e remanejamento entre obras.
- Registro de baixas para consumo e devolução de sobras ao final do projeto.
- Atualização instantânea refletida nos gráficos gerenciais.

### Cadastro Automatizado (BrasilAPI)
Integração com serviços externos para facilitar as rotinas administrativas e operacionais do canteiro de obras.

**Características:**
- Conexão assíncrona com a BrasilAPI.
- Preenchimento robotizado de dados de fornecedores a partir da digitação do CNPJ.
- Redução significativa de erros de digitação humana e agilidade no cadastro.

### Persistência em Nuvem (Firebase)
A aplicação utiliza a infraestrutura do Google Firebase para garantir que os dados de estoque nunca sejam perdidos e estejam sempre atualizados.

**Características:**
- Banco de dados NoSQL (`Firestore`) orientado a documentos.
- Sincronização instantânea de dados entre o almoxarifado central e as obras.
- Alta escalabilidade e segurança na hospedagem estática via `Firebase Hosting`.

## Arquitetura e Tecnologias

A estruturação do projeto segue a separação de responsabilidades para garantir fácil manutenção:

| Camada / Função | Tecnologias Utilizadas | Propósito Principal |
|-----------------|------------------------|---------------------|
| **Apresentação (View)** | HTML5, CSS3, React | Estrutura semântica, interface Mobile-First e componentes reutilizáveis. |
| **Lógica (Controller)** | JavaScript | Interatividade, manipulação do DOM e requisições assíncronas (APIs). |
| **Persistência (Model)**| Firebase Firestore | Banco de dados NoSQL para salvar e sincronizar o estoque em tempo real. |
| **Visualização de Dados**| Chart.js | Renderização dinâmica de gráficos analíticos para a gestão. |
| **Automação Externa** | BrasilAPI | Consulta gratuita de CNPJ para agilizar cadastros. |
| **Hospedagem (Cloud)** | Firebase Hosting | Entrega do front-end com segurança e alta performance. |

## Ferramentas

![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Firebase](https://img.shields.io/badge/firebase-%23039BE5.svg?style=for-the-badge&logo=firebase)
![Git](https://img.shields.io/badge/GIT-E44C30?style=for-the-badge&logo=git&logoColor=white)
