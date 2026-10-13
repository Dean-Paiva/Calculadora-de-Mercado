import { colors, purchaseStyles as styles } from "../../theme/styles";
import { useCallback, useEffect, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Alert, Pressable, SafeAreaView, ScrollView, StatusBar, Text, TextInput, View } from "react-native";
import { buscarCompra, excluirCompra, salvarCompra } from "../../services/storage";
import type { Compra, ItemCompra } from "../../types/compra";

function moeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function converterMeta(valor: string) {
  const limpo = valor.trim().replace(/\s/g, "");
  const normalizado = limpo.includes(",")
    ? limpo.replace(/\./g, "").replace(",", ".")
    : limpo;
  const numero = Number(normalizado.replace(/[^\d.-]/g, ""));
  return Number.isFinite(numero) && numero > 0 ? numero : null;
}

export default function DetalhesCompraScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [compra, setCompra] = useState<Compra | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [editandoNome, setEditandoNome] = useState(false);
  const [nomeRascunho, setNomeRascunho] = useState("");
  const [excluindo, setExcluindo] = useState(false);
  const [editandoMeta, setEditandoMeta] = useState(false);
  const [textoMeta, setTextoMeta] = useState("");
  const [erroMeta, setErroMeta] = useState("");

  const carregar = useCallback(async () => {
    try {
      const resultado = await buscarCompra(id);
      setCompra(resultado ?? null);
    } finally {
      setCarregando(false);
    }
  }, [id]);

  useEffect(() => { void carregar(); }, [carregar]);
  useFocusEffect(useCallback(() => { void carregar(); }, [carregar]));

  async function atualizarCompra(produtos: ItemCompra[]) {
    if (!compra) return;
    const atualizada = { ...compra, produtos };
    setCompra(atualizada);
    try {
      await salvarCompra(atualizada);
    } catch {
      Alert.alert("Não foi possível salvar", "Tente novamente.");
      await carregar();
    }
  }

  async function salvarNome() {
    const nome = nomeRascunho.trim();
    if (!compra || !nome) {
      Alert.alert("Nome obrigatório", "Digite um nome para esta compra.");
      return;
    }
    const atualizada = { ...compra, nome };
    setCompra(atualizada);
    setEditandoNome(false);
    try {
      await salvarCompra(atualizada);
    } catch {
      Alert.alert("Não foi possível salvar", "Tente novamente.");
      await carregar();
    }
  }

  async function salvarMeta() {
    const valor = converterMeta(textoMeta);
    if (!compra || valor === null) {
      setErroMeta("Digite uma meta maior que zero.");
      return;
    }

    const atualizada = { ...compra, meta: valor };
    setCompra(atualizada);
    try {
      await salvarCompra(atualizada);
      setEditandoMeta(false);
      setErroMeta("");
    } catch {
      setErroMeta("Não foi possível salvar a meta. Tente novamente.");
      await carregar();
    }
  }

  function confirmarExclusao() {
    if (!compra) return;
    Alert.alert("Excluir compra?", `“${compra.nome}” e todos os seus produtos serão excluídos.`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir compra", style: "destructive", onPress: () => { void removerCompra(); } },
    ]);
  }

  async function removerCompra() {
    setExcluindo(true);
    try {
      await excluirCompra(id);
      router.replace("/");
    } catch {
      setExcluindo(false);
      Alert.alert("Não foi possível excluir", "Tente novamente.");
    }
  }

  function alterarQuantidade(produtoId: string, delta: number) {
    if (!compra) return;
    const produtos = compra.produtos
      .map((produto) => produto.id === produtoId
        ? { ...produto, quantidade: produto.quantidade + delta }
        : produto)
      .filter((produto) => produto.quantidade > 0);
    void atualizarCompra(produtos);
  }

  function excluirProduto(produtoId: string) {
    if (!compra) return;
    Alert.alert("Excluir produto?", "O item será removido desta compra.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: () => {
        void atualizarCompra(compra.produtos.filter((produto) => produto.id !== produtoId));
      } },
    ]);
  }

  if (carregando) return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>;
  if (!compra) return <View style={styles.center}><Text style={styles.title}>Compra não encontrada</Text><Pressable onPress={() => router.replace("/")}><Text style={styles.action}>Voltar ao início</Text></Pressable></View>;

  const total = compra.produtos.reduce((soma, produto) => soma + produto.preco * produto.quantidade, 0);
  const quantidadeItens = compra.produtos.reduce((soma, produto) => soma + produto.quantidade, 0);
  const restanteMeta = compra.meta === undefined ? null : compra.meta - total;
  const data = new Date(compra.dataCriacao);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Pressable accessibilityRole="button" onPress={() => router.back()}><Text style={styles.back}>‹  Voltar às compras</Text></Pressable>
          <View style={styles.titleRow}>
            {editandoNome ? (
              <View style={styles.nameEditor}>
                <TextInput autoFocus value={nomeRascunho} onChangeText={setNomeRascunho} onSubmitEditing={() => void salvarNome()} returnKeyType="done" maxLength={50} placeholder="Ex.: Padaria" placeholderTextColor={colors.placeholder} style={styles.nameInput} accessibilityLabel="Nome da compra" />
                <Pressable accessibilityRole="button" onPress={() => void salvarNome()}><Text style={styles.nameAction}>Salvar</Text></Pressable>
                <Pressable accessibilityRole="button" onPress={() => setEditandoNome(false)}><Text style={styles.cancelAction}>Cancelar</Text></Pressable>
              </View>
            ) : (
              <>
                <Text style={styles.title}>{compra.nome}</Text>
                <Pressable accessibilityRole="button" accessibilityLabel="Editar nome da compra" onPress={() => { setNomeRascunho(compra.nome); setEditandoNome(true); }}><Text style={styles.editAction}>Editar</Text></Pressable>
              </>
            )}
          </View>
          <Text style={styles.date}>{data.toLocaleDateString("pt-BR")} · {data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</Text>

          <View style={styles.summaryGoalCard}>
            <View style={styles.totalSummaryHeader}>
              <Text style={styles.totalLabel}>Total da compra</Text>
              <Text style={styles.topTotal}>{moeda(total)}</Text>
            </View>
            <View style={styles.totalSummaryFooter}>
              <Text style={styles.itemCount}>{quantidadeItens} {quantidadeItens === 1 ? "item" : "itens"}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.goalHeader}>
              <View style={styles.goalTitleGroup}>
                <Text style={styles.goalTitle}>Meta desta compra</Text>
                {compra.meta !== undefined && !editandoMeta && <Text style={styles.goalAmount}>{moeda(compra.meta)}</Text>}
              </View>
            </View>
            {editandoMeta ? (
              <View>
                <View style={styles.goalEditor}>
                  <Text style={styles.goalCurrency}>R$</Text>
                  <TextInput
                    accessibilityLabel="Meta desta compra"
                    keyboardType="decimal-pad"
                    value={textoMeta}
                    onChangeText={setTextoMeta}
                    onSubmitEditing={() => void salvarMeta()}
                    placeholder="Ex.: 250,00"
                    placeholderTextColor={colors.placeholder}
                    style={styles.goalInput}
                  />
                  <Pressable accessibilityRole="button" onPress={() => void salvarMeta()}><Text style={styles.goalAction}>Salvar</Text></Pressable>
                </View>
                {!!erroMeta && <Text style={styles.goalError}>{erroMeta}</Text>}
                <Pressable accessibilityRole="button" onPress={() => { setEditandoMeta(false); setErroMeta(""); }}><Text style={styles.goalCancel}>Cancelar</Text></Pressable>
              </View>
            ) : compra.meta === undefined ? (
              <View style={styles.goalActionRow}>
                <Text style={styles.goalDescription}>Defina um limite para esta compra.</Text>
                <Pressable accessibilityRole="button" onPress={() => { setTextoMeta(""); setEditandoMeta(true); setErroMeta(""); }}>
                  <Text style={styles.goalAction}>Definir</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <View style={styles.goalProgressTrack}>
                  <View style={[styles.goalProgressFill, { width: `${Math.min((total / compra.meta) * 100, 100)}%`, backgroundColor: total > compra.meta ? colors.danger : colors.primary }]} />
                </View>
                <Pressable
                  accessibilityRole="button"
                  style={styles.goalEditBelow}
                  onPress={() => { setTextoMeta(compra.meta?.toFixed(2).replace(".", ",") ?? ""); setEditandoMeta(true); setErroMeta(""); }}
                >
                  <Text style={styles.goalAction}>Editar meta</Text>
                </Pressable>
                <Text style={[styles.goalRemaining, restanteMeta !== null && restanteMeta < 0 && styles.goalExceeded]}>
                  {restanteMeta !== null && restanteMeta >= 0
                    ? `Restam ${moeda(restanteMeta)}`
                    : `Meta ultrapassada em ${moeda(Math.abs(restanteMeta ?? 0))}`}
                </Text>
              </>
            )}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Itens da compra ({compra.produtos.length})</Text>
          </View>
          {compra.produtos.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🛒</Text>
              <Text style={styles.emptyTitle}>Sua compra está vazia</Text>
              <Text style={styles.emptyText}>Adicione produtos para acompanhar o total.</Text>
            </View>
          ) : compra.produtos.map((produto) => (
            <View key={produto.id} style={styles.productCard}>
              <View style={styles.productMain}>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{produto.nome}</Text>
                  <Text style={styles.unitPrice}>{moeda(produto.preco)} cada</Text>
                </View>
                <Text style={styles.lineTotal}>{moeda(produto.preco * produto.quantidade)}</Text>
              </View>
              <View style={styles.productActions}>
                <View style={styles.quantityControls}>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Diminuir ${produto.nome}`} style={styles.quantityButton} onPress={() => alterarQuantidade(produto.id, -1)}><Text style={styles.quantitySymbol}>−</Text></Pressable>
                  <Text style={styles.quantity}>{produto.quantidade}</Text>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Aumentar ${produto.nome}`} style={styles.quantityButton} onPress={() => alterarQuantidade(produto.id, 1)}><Text style={styles.quantitySymbol}>+</Text></Pressable>
                </View>
                <View style={styles.itemActionButtons}>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Editar ${produto.nome}`} style={styles.editProductButton} onPress={() => router.push({ pathname: "/compras/[id]/adicionar", params: { id, produtoId: produto.id } })}><Text style={styles.editProduct}>Editar</Text></Pressable>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Excluir ${produto.nome}`} style={styles.deleteProductButton} onPress={() => excluirProduto(produto.id)}><Text style={styles.delete}>Excluir</Text></Pressable>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable accessibilityRole="button" style={({ pressed }) => [styles.addButton, pressed && styles.pressed]} onPress={() => router.push({ pathname: "/compras/[id]/adicionar", params: { id } })}>
            <Text style={styles.addButtonText}>＋  Adicionar produto</Text>
          </Pressable>
          <Pressable accessibilityRole="button" disabled={excluindo} style={styles.deletePurchaseButton} onPress={confirmarExclusao}>
            <Text style={styles.deletePurchaseText}>{excluindo ? "Excluindo compra..." : "Excluir compra"}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}


