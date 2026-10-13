
export type ItemCompra = {
  id: string;
  nome: string;
  preco: number;
  quantidade: number;
};

export type Compra = {
  id: string;
  nome: string;
  dataCriacao: string;
  produtos: ItemCompra[];
  meta?: number;
};
