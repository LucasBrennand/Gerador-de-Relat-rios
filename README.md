# Relatório mensal de vendas

Aplicação local com interface React e API Python para montar o relatório mensal em PDF.

## Executar

1. Backend: `cd backend`, crie um ambiente virtual, instale `pip install -r requirements.txt` e rode `uvicorn app:app --reload`.
2. Frontend: `cd frontend`, rode `npm install` e `npm run dev`.
3. Abra o endereço indicado pelo Vite (normalmente `http://localhost:5173`).

Localmente, o relatório é gerado pela API em `http://localhost:8000`. Em produção, o endereço da API vem de `VITE_API_URL`; a configuração Render já define esse endereço e libera o domínio do site pelo CORS. Os campos da empresa e as vendas são enviados para a API para gerar o PDF e não são gravados em banco de dados.

## Entrada de vendas

Cole uma venda por linha no formato `DD/MM/AAAA; valor`, como `01/08/2026; 1.287,00`. Linhas copiadas de uma tabela com espaços ou tabulação também são aceitas. Edite o cabeçalho, selecione o mês, anexe a logo e o gráfico em PNG/JPG para incluí-los no PDF. A logo é opcional e aparece ao lado dos dados da empresa.

## Publicar no Render

O arquivo `render.yaml` configura dois serviços a partir deste repositório: uma API Python e o site React estático. Depois de enviar o projeto ao GitHub:

1. Entre no Render e escolha **New > Blueprint**.
2. Conecte o repositório `LucasBrennand/Gerador-de-Relat-rios`.
3. Confira os dois serviços listados e clique em **Apply**.
4. Quando o deploy terminar, abra o serviço `lure-relatorios-site` para acessar o gerador.

A API no plano gratuito pode ficar alguns minutos inativa depois de 15 minutos sem acesso; a primeira geração após esse período pode demorar enquanto o serviço reinicia.
