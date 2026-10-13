import { colors, productFormStyles as styles } from "../../../theme/styles";
import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Alert, Pressable, SafeAreaView, ScrollView, StatusBar, Text, TextInput, View } from "react-native";
import { buscarCompra, salvarCompra } from "../../../services/storage";
import type { ItemCompra } from "../../../types/compra";

const DIGITS_LIMIT = 10;

function formatarPreco(digitos: string) {
  const centavos = Number(digitos || "0");
  return (centavos / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function AdicionarProdutoScreen() {
  const router = useRouter();
  const { id, produtoId } = useLocalSearchParams<{ id: string; produtoId?: string }>();
  const [nome, setNome] = useState("");
  const [precoEmCentavos, setPrecoEmCentavos] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [salvando, setSalvando] = useState(false);
  const [carregandoProduto, setCarregandoProduto] = useState(Boolean(produtoId));

  useEffect(() => {
    if (!produtoId) return;
    let ativo = true;
    async function carregarProduto() {
      try {
        const compra = await buscarCompra(id);
        const produto = compra?.produtos.find((item) => item.id === produtoId);
        if (!produto) {
          Alert.alert("Produto não encontrado", "Este item não está mais nesta compra.");
          router.dismissTo({ pathname: "/compras/[id]", params: { id } });
          return;
        }
        if (ativo) {
          setNome(produto.nome);
          setPrecoEmCentavos(String(Math.round(produto.preco * 100)));
          setQuantidade(produto.quantidade);
        }
      } catch {
        Alert.alert("Não foi possível carregar o produto", "Volte à compra e tente novamente.");
        router.dismissTo({ pathname: "/compras/[id]", params: { id } });
      } finally {
        if (ativo) setCarregandoProduto(false);
      }
    }
    void carregarProduto();
    return () => { ativo = false; };
  }, [id, produtoId, router]);

  function digitar(valor: string) {
    if (precoEmCentavos.length < DIGITS_LIMIT) setPrecoEmCentavos((atual) => atual + valor);
  }

  function apagarDigito() {
    setPrecoEmCentavos((atual) => atual.slice(0, -1));
  }

  async function adicionar() {
    const nomeLimpo = nome.trim() || "Produto sem nome";
    const preco = Number(precoEmCentavos || "0") / 100;
    if (preco <= 0) { Alert.alert("Informe o preço", "O preço precisa ser maior que zero."); return; }

    setSalvando(true);
    try {
      const compra = await buscarCompra(id);
      if (!compra) { Alert.alert("Compra não encontrada", "Volte para a lista de compras e tente novamente."); return; }
      const produtoExistente = produtoId ? compra.produtos.find((item) => item.id === produtoId) : undefined;
      const produto: ItemCompra = { id: produtoExistente?.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, nome: nomeLimpo, preco, quantidade };
      const produtos = produtoExistente
        ? compra.produtos.map((item) => item.id === produtoId ? produto : item)
        : [produto, ...compra.produtos];
      await salvarCompra({ ...compra, produtos });
      router.dismissTo({ pathname: "/compras/[id]", params: { id } });
    } catch {
      Alert.alert("Não foi possível salvar", "Confira sua conexão e tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Pressable accessibilityRole="button" onPress={() => router.back()}><Text style={styles.back}>‹  Voltar</Text></Pressable>
          <Text style={styles.title}>{produtoId ? "Editar produto" : "Adicionar produto"}</Text>
          <Text style={styles.subtitle}>{produtoId ? "Altere os dados deste item da compra." : "Informe os dados do item da sua compra."}</Text>

          <Text style={styles.label}>Nome do produto (opcional)</Text>
          <TextInput value={nome} onChangeText={setNome} placeholder="Ex.: Arroz 5kg" placeholderTextColor={colors.placeholder} style={styles.input} returnKeyType="done" maxLength={70} accessibilityLabel="Nome do produto" />

          <Text style={styles.label}>Preço unitário</Text>
          <View style={styles.priceField}>
            <Text style={styles.currency}>R$</Text>
            <Text style={styles.priceValue}>{formatarPreco(precoEmCentavos)}</Text>
          </View>
          <Text style={styles.helper}>Toque nos números para informar o preço.</Text>

          <Text style={styles.label}>Quantidade</Text>
          <View style={styles.quantityRow}>
            <Pressable accessibilityRole="button" accessibilityLabel="Diminuir quantidade" style={styles.quantityButton} onPress={() => setQuantidade((q) => Math.max(1, q - 1))}><Text style={styles.quantitySymbol}>−</Text></Pressable>
            <Text style={styles.quantity}>{quantidade}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Aumentar quantidade" style={styles.quantityButton} onPress={() => setQuantidade((q) => q + 1)}><Text style={styles.quantitySymbol}>+</Text></Pressable>
          </View>

          <View style={styles.keypad}>
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "0", "⌫"].map((key) => (
              <Pressable key={key} accessibilityRole="button" accessibilityLabel={key === "⌫" ? "Apagar último dígito" : `Digitar ${key}`} style={({ pressed }) => [styles.key, pressed && styles.keyPressed]} onPress={() => key === "⌫" ? apagarDigito() : key !== "," && digitar(key)}>
                <Text style={styles.keyText}>{key}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Text style={styles.subtotal}>Subtotal: {(Number(precoEmCentavos || "0") / 100 * quantidade).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</Text>
          <Pressable accessibilityRole="button" disabled={salvando || carregandoProduto} style={({ pressed }) => [styles.saveButton, pressed && styles.pressed, (salvando || carregandoProduto) && styles.disabled]} onPress={() => void adicionar()}>
            {salvando || carregandoProduto ? <ActivityIndicator color={colors.background} /> : <Text style={styles.saveText}>{produtoId ? "Salvar alterações" : "Adicionar à compra"}</Text>}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}


