# CableForge

App local para criar chicotes elétricos com saída compatível com o [WireViz](https://github.com/wireviz/WireViz).

## O que esta versão faz

- Cadastre conectores com código da LCSC.
- Use `supplier: LCSC` e `spn` para o código da peça.
- Monte cabos, bitolas, comprimento e contagem de vias.
- Gere YAML pronto para o WireViz.
- Exporte o arquivo `.yml` para rodar o CLI oficial depois.
- Cadastre modelos locais na aba `Banco de dados` para reutilizar conectores e cabos.

## Como usar

1. Inicie a app com um destes comandos:

```bash
npm start
```

Ou:

```bash
./run.sh
```

Se quiser usar outra porta, passe ela como argumento, por exemplo `./run.sh 8080`.

2. Acesse `http://127.0.0.1:8000`.
3. Preencha os conectores, cabos e ligações.
4. Clique em `Gerar com WireViz` para renderizar SVG e BOM direto na app.
5. Clique em `Exportar PNG` para baixar apenas a imagem do chicote.

O backend roda o WireViz localmente e usa o Graphviz instalado no sistema para gerar os artefatos.

## Se `wireviz` não existir

O WireViz publica um comando de console chamado `wireviz` via `pip` e ele depende do Graphviz instalado no sistema.

Instalação típica:

```bash
python3 -m pip install --user wireviz
```

Depois, confirme que o diretório de binários do usuário está no `PATH` e rode:

```bash
wireviz cabo-coel.yml
```

Se ainda aparecer erro, instale o Graphviz no sistema operacional.

Exemplos comuns:

```bash
sudo apt install graphviz
```

```bash
sudo dnf install graphviz
```

```bash
sudo pacman -S graphviz
```

## Estrutura da saída

O app gera um YAML com as seções principais do WireViz:

- `metadata`
- `connectors`
- `cables`
- `connections`

Os conectores já saem com os campos de rastreabilidade mais úteis para fabricação:

- `supplier: LCSC`
- `spn: Cxxxxxx`
- `manufacturer`
- `mpn`

## Ajustes futuros

Se você quiser, o próximo passo pode ser:

1. importar/exportar projetos em JSON;
2. adicionar validação de pinagem e verificação de contagem de vias;
3. integrar um preview automático do SVG gerado pelo WireViz.
