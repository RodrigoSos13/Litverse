import { useCallback, useEffect, useState } from "react";
import api from "../services/api";

export const readingTabs = [
  { key: "lendo", label: "Lendo", empty: "Suas próximas páginas começam aqui.", description: "Os livros que estão acompanhando seus dias." },
  { key: "quero_ler", label: "Quero ler", empty: "Toda próxima leitura começa com uma descoberta.", description: "Histórias guardadas para o próximo capítulo." },
  { key: "lido", label: "Lidos", empty: "Cada livro concluído conta uma história sua.", description: "As histórias que já fazem parte de você." },
];

export default function useUserProfile(id) {
  const [state, setState] = useState({ id, profile: null, error: "" });
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion(value => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    setState({ id, profile: null, error: "" });
    api.get(`/users/${id}/profile`, { signal: controller.signal }).then(({ data }) => {
      if (!controller.signal.aborted) setState({ id, profile: data, error: "" });
    }).catch(error => {
      if (!controller.signal.aborted) setState({ id, profile: null, error: error.response?.data?.message || "Não foi possível carregar este perfil." });
    });
    return () => controller.abort();
  }, [id, version]);
  return { profile: state.id === id ? state.profile : null, error: state.id === id ? state.error : "", refresh };
}
