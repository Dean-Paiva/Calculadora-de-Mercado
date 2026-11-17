# Calculadora de Mercado

Aplicativo mobile para registrar compras de mercado, acompanhar produtos e valores em tempo real e comparar os gastos com metas. O projeto usa Expo SDK 58, React Native 0.88, TypeScript e Expo Router.

## O que o app oferece

- Criar compras e dar um nome a cada uma.
- Adicionar produtos com preço unitário e quantidade; editar, remover e ajustar quantidades depois.
- Ver o subtotal de cada produto, o total de cada compra e o acumulado de todas as compras salvas.
- Definir uma meta geral e metas individuais por compra, com indicação do valor restante ou excedido.
- Manter os dados no armazenamento local do dispositivo usando AsyncStorage.

## Requisitos

- Node.js compatível com as ferramentas Expo SDK 58.
- npm (há `package-lock.json`; não há `bun.lock`).
- Expo Go para desenvolvimento quando os módulos usados estiverem disponíveis nessa versão, ou um development build para validar o app em dispositivo/emulador.

## Começar

```bash
npm install
npx expo start
```

No terminal do Expo, escolha abrir no Android, iOS ou web. Os scripts `npm run android`, `npm run ios` e `npm run web` também iniciam o servidor direcionado à plataforma. O projeto não inclui diretórios `ios/` e `android/`; a configuração nativa é gerada pelo Expo (Continuous Native Generation).

## Comandos do projeto

```bash
npx expo start       # servidor de desenvolvimento
npx expo start --web # servidor web
npx expo lint        # lint do Expo/ESLint
npx tsc --noEmit     # checagem TypeScript
npx expo-doctor      # diagnóstico de configuração e dependências
```

Ao adicionar uma dependência, use `npx expo install <pacote>` para selecionar uma versão compatível com o SDK. Bibliotecas que adicionem código nativo precisam de development build; consulte o guia de desenvolvimento antes de incluí-las.

## Estrutura

```text
src/
  app/                    Rotas e telas do Expo Router
    _layout.tsx           Navegador raiz
    index.tsx             Início, resumo, meta geral e histórico
    compras/
      nova.tsx            Criação e encaminhamento para uma nova compra
      [id].tsx            Detalhe e edição da compra
      [id]/adicionar.tsx  Formulário para adicionar/editar produto
  services/storage.ts     Persistência local via AsyncStorage
  theme/styles.ts         Tokens de cor e estilos compartilhados
  types/compra.ts         Tipos Compra e ItemCompra
  utils/compra.ts         Cálculos e formatação de valores
assets/                   Ícones e recursos de imagem
```

## Documentação adicional

- [Guia de uso](docs/GUIA_USUARIO.md)
- [Arquitetura e dados](docs/ARQUITETURA.md)
- [Desenvolvimento e publicação](docs/DESENVOLVIMENTO.md)

## Limites conhecidos

Os dados ficam no armazenamento local do app e não são sincronizados entre dispositivos nem enviados para um servidor. Não há conta de usuário, exportação, compartilhamento de listas ou integração com preços de lojas. Desinstalar ou limpar os dados do aplicativo pode apagar as compras salvas. O APK `Calculadora_de_mercado.apk` presente na raiz é um artefato existente; sua data/versão de build deve ser confirmada antes de distribuição.

## Licença

O repositório contém um arquivo `LICENSE` com licença MIT atribuída ao Expo. Confirme a titularidade e o texto de licença apropriado para o aplicativo antes de distribuir o projeto como um todo.
