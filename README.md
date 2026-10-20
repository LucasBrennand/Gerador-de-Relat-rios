# Relatório mensal de vendas

Aplicação local com interface React e API Python para montar o relatório mensal em PDF.

## Executar

1. Backend: `cd backend`, crie um ambiente virtual, instale `pip install -r requirements.txt` e rode `uvicorn app:app --reload`.
2. Frontend: `cd frontend`, rode `npm install` e `npm run dev`.
3. Abra o endereço indicado pelo Vite (normalmente `http://localhost:5173`).

O relatório é gerado no navegador pela API em `http://localhost:8000`. Os campos da empresa e as vendas são enviados apenas para essa API local; não há banco de dados.

## Entrada de vendas

Cole uma venda por linha no formato `DD/MM/AAAA; valor`, como `01/08/2026; 1.287,00`. Linhas copiadas de uma tabela com espaços ou tabulação também são aceitas. Edite o cabeçalho, selecione o mês, anexe a logo e o gráfico em PNG/JPG para incluí-los no PDF. A logo é opcional e aparece ao lado dos dados da empresa.
