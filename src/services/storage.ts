
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Compra } from "../types/compra";

const CHAVE_COMPRAS = "@calculadora-mercado/compras";
const CHAVE_META_COMPRAS = "@calculadora-mercado/meta-compras";

export async function buscarMetaCompras(): Promise<number | null> {
  const valor = await AsyncStorage.getItem(CHAVE_META_COMPRAS);
  if (valor === null) return null;

  const meta = Number(valor);
  return Number.isFinite(meta) && meta > 0 ? meta : null;
}

export async function salvarMetaCompras(meta: number): Promise<void> {
  await AsyncStorage.setItem(CHAVE_META_COMPRAS, String(meta));
}

export async function listarCompras(): Promise<Compra[]> {
  const dados = await AsyncStorage.getItem(CHAVE_COMPRAS);

  if (!dados) {
    return [];
  }

  return JSON.parse(dados) as Compra[];
}

export async function buscarCompra(
  id: string
): Promise<Compra | undefined> {
  const compras = await listarCompras();
  return compras.find((compra) => compra.id === id);
}

export async function salvarCompra(compra: Compra): Promise<void> {
  const compras = await listarCompras();
  const indice = compras.findIndex((item) => item.id === compra.id);

  if (indice >= 0) {
    compras[indice] = compra;
  } else {
    compras.unshift(compra);
  }

  await AsyncStorage.setItem(
    CHAVE_COMPRAS,
    JSON.stringify(compras)
  );
}

export async function excluirCompra(id: string): Promise<void> {
  const compras = await listarCompras();
  await AsyncStorage.setItem(
    CHAVE_COMPRAS,
    JSON.stringify(compras.filter((compra) => compra.id !== id))
  );
}
