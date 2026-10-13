import { colors, newPurchaseStyles as styles } from "../../theme/styles";

import { useEffect, useRef } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { salvarCompra } from "../../services/storage";
import type { Compra } from "../../types/compra";

export default function NovaCompraScreen() {
  const router = useRouter();
  const iniciada = useRef(false);

  useEffect(() => {
    if (iniciada.current) return;
    iniciada.current = true;

    async function criarCompra() {
      const agora = new Date();

      const compra: Compra = {
        id: `${agora.getTime()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,
        nome: "Minha compra",
        dataCriacao: agora.toISOString(),
        produtos: [],
      };

      try {
        await salvarCompra(compra);

        router.replace({
          pathname: "/compras/[id]",
          params: { id: compra.id },
        });
      } catch {
        iniciada.current = false;
      }
    }

    criarCompra();
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.title}>Preparando sua compra...</Text>
      <Text style={styles.subtitle}>
        Registrando a data e salvando seus dados.
      </Text>
    </View>
  );
}


