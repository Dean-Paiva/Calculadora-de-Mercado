import { colors, homeStyles as styles } from "../theme/styles";
import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { buscarMetaCompras, listarCompras, salvarMetaCompras } from "../services/storage";
import type { Compra } from "../types/compra"; 
import { SafeAreaView, View, Text, ScrollView, Pressable, StatusBar, TextInput } from "react-native";

function moeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function contagemItens(compra: Compra) {
  const quantidade = compra.produtos.reduce((soma, produto) => soma + produto.quantidade, 0);
  return `${quantidade} ${quantidade === 1 ? "item" : "itens"}`;
}

function converterMeta(valor: string) {
  const limpo = valor.trim().replace(/\s/g, "");
  const normalizado = limpo.includes(",")
    ? limpo.replace(/\./g, "").replace(",", ".")
    : limpo;
  const numero = Number(normalizado.replace(/[^\d.-]/g, ""));
  return Number.isFinite(numero) && numero > 0 ? numero : null;
}

export default function HomeScreen() {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [mostrarTodas, setMostrarTodas] = useState(false);
  const [metaCompras, setMetaCompras] = useState<number | null>(null);
  const [textoMeta, setTextoMeta] = useState("");
  const [editandoMeta, setEditandoMeta] = useState(false);
  const [erroMeta, setErroMeta] = useState("");

  const carregarCompras = useCallback(async () => {
    const [dados, meta] = await Promise.all([listarCompras(), buscarMetaCompras()]);
    setCompras(dados);
    setMetaCompras(meta);
    setTextoMeta(meta === null ? "" : meta.toFixed(2).replace(".", ","));
  }, []);

  useFocusEffect(useCallback(() => {
    void carregarCompras();
  }, [carregarCompras]));

  const totalCompras = compras.reduce(
    (soma, compra) =>
      soma +
      compra.produtos.reduce(
        (subtotal, produto) =>
          subtotal + produto.preco * produto.quantidade,
        0
      ),
    0
  );
  const totalItens = compras.reduce(
    (soma, compra) => soma + compra.produtos.reduce((subtotal, produto) => subtotal + produto.quantidade, 0),
    0
  );
  const restanteMeta = metaCompras === null ? null : metaCompras - totalCompras;

  const router = useRouter();

  function iniciarCompra() {
    router.push("/compras/nova");
  }

  async function salvarMeta() {
    const valor = converterMeta(textoMeta);
    if (valor === null) {
      setErroMeta("Digite uma meta maior que zero.");
      return;
    }

    try {
      await salvarMetaCompras(valor);
      setMetaCompras(valor);
      setTextoMeta(valor.toFixed(2).replace(".", ","));
      setEditandoMeta(false);
      setErroMeta("");
    } catch {
      setErroMeta("Não foi possível salvar a meta. Tente novamente.");
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* Logo e identificação do app */}
          <View style={styles.header}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>🛒</Text>
            </View>
            <View style={styles.headerText}>
              <Text style={styles.appName}>Calculadora de Mercado</Text>
              <Text style={styles.subtitle}>Suas compras sob controle</Text>
            </View>
          </View>

          {/* Total em destaque no topo */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryTop}>
              <View>
                <Text style={styles.summaryLabel}>
                  Total das compras
                </Text>
                
                <Text style={styles.totalValue}>
                  {moeda(totalCompras)}
                </Text>

              </View>

              <View style={styles.summaryIcon}>
                <Text style={styles.summaryEmoji}>$</Text>
              </View>
            </View>

            <View style={styles.summaryFooter}>
              <Text style={styles.summaryHint}>
                Total acumulado das compras
              </Text>
              <Text style={styles.itemCount}>
                {totalItens} {totalItens === 1 ? "item" : "itens"}
              </Text>
            </View>
          </View>

          <View style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <View style={styles.goalTitleGroup}>
                <Text style={styles.goalTitle}>Meta das compras</Text>
                {metaCompras !== null && !editandoMeta && (
                  <Text style={styles.goalAmount}>{moeda(metaCompras)}</Text>
                )}
              </View>
              {!editandoMeta && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => { setTextoMeta(metaCompras === null ? "" : metaCompras.toFixed(2).replace(".", ",")); setEditandoMeta(true); setErroMeta(""); }}
                >
                  <Text style={styles.goalAction}>{metaCompras === null ? "Definir" : "Editar"}</Text>
                </Pressable>
              )}
            </View>

            {editandoMeta ? (
              <View>
                <View style={styles.goalEditor}>
                  <Text style={styles.currencyPrefix}>R$</Text>
                  <TextInput
                    accessibilityLabel="Valor da meta de compras"
                    value={textoMeta}
                    onChangeText={setTextoMeta}
                    onSubmitEditing={() => void salvarMeta()}
                    keyboardType="decimal-pad"
                    placeholder="Ex.: 500,00"
                    placeholderTextColor={colors.placeholder}
                    style={styles.goalInput}
                  />
                  <Pressable accessibilityRole="button" onPress={() => void salvarMeta()}>
                    <Text style={styles.goalAction}>Salvar</Text>
                  </Pressable>
                </View>
                {!!erroMeta && <Text style={styles.goalError}>{erroMeta}</Text>}
                <Pressable accessibilityRole="button" onPress={() => { setEditandoMeta(false); setErroMeta(""); }}>
                  <Text style={styles.goalCancel}>Cancelar</Text>
                </Pressable>
              </View>
            ) : metaCompras === null ? (
              <Text style={styles.goalDescription}>Defina um limite para acompanhar quanto ainda pode gastar.</Text>
            ) : (
              <>
                <View style={styles.goalProgressTrack}>
                  <View style={[styles.goalProgressFill, { width: `${Math.min((totalCompras / metaCompras) * 100, 100)}%`, backgroundColor: totalCompras > metaCompras ? colors.danger : colors.primary }]} />
                </View>
                <Text style={[styles.goalRemaining, restanteMeta !== null && restanteMeta < 0 && styles.goalExceeded]}>
                  {restanteMeta !== null && restanteMeta >= 0
                    ? `Restam ${moeda(restanteMeta)}`
                    : `Meta ultrapassada em ${moeda(Math.abs(restanteMeta ?? 0))}`}
                </Text>
              </>
            )}
          </View>

          {/* Histórico */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Compras recentes
            </Text>

            <Pressable accessibilityRole="button" onPress={() => setMostrarTodas((visivel) => !visivel)}>
              <Text style={styles.seeAll}>
                {mostrarTodas ? "Ver menos ‹" : "Ver todas ›"}
              </Text>
            </Pressable>
          </View>

          {compras.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Text style={styles.emptyEmoji}>🛍️</Text>
              </View>

              <Text style={styles.emptyTitle}>
                Nenhuma compra por aqui
              </Text>

              <Text style={styles.emptyDescription}>
                Comece uma nova compra e adicione
                os produtos que você encontrar no mercado.
              </Text>

              <Pressable onPress={iniciarCompra}>
                <Text style={styles.emptyAction}>
                  Criar minha primeira compra →
                </Text>
              </Pressable>
            </View>
          ) : (
            compras.slice(0, mostrarTodas ? compras.length : 4).map((compra) => (
              <Pressable
                key={compra.id}
                accessibilityRole="button"
                accessibilityLabel={`Abrir compra ${compra.nome}`}
                style={styles.purchaseCard}
                onPress={() => router.push({ pathname: "/compras/[id]", params: { id: compra.id } })}
              >
                <View style={styles.historyIcon}>
                  <Text>🛒</Text>
                </View>

                <View style={styles.purchaseInfo}>
                  <Text style={styles.purchaseName}>
                    {compra.nome}
                  </Text>
                  
                  <Text style={styles.purchaseDate}>
                    {new Date(compra.dataCriacao).toLocaleString("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </Text>

                  <Text style={styles.purchaseTotal}>
                    {compra.produtos.reduce(
                      (total, produto) =>
                        total + produto.preco * produto.quantidade,
                      0
                    ).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </Text>

                </View>

                <View style={styles.purchaseRightInfo}>
                  <Text style={styles.purchaseItemCount}>
                    {contagemItens(compra)}
                  </Text>
                  <Text style={styles.arrow}>›</Text>
                </View>
              </Pressable>
            ))
          )}

        </ScrollView>

        <View style={styles.bottomAction}>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.newPurchaseButton,
              styles.bottomPurchaseButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={iniciarCompra}
          >
            <Text style={styles.plus}>＋</Text>
            <Text style={styles.newPurchaseText}>Iniciar nova compra</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}


