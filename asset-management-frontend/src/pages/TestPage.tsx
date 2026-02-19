import { useEffect } from "react";
import api from "../api/client";

export function TestPage() {
  useEffect(() => {
    async function testConnection() {
      try {
        const response = await api.get("/dashboard/executive");
        console.log("Resposta do backend:", response.data);
      } catch (error) {
        console.error("Erro ao conectar:", error);
      }
    }

    testConnection();
  }, []);

  return <h1>Testando conexão com backend...</h1>;
}
