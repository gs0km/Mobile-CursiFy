export type ContentKey = "material" | "exercicios" | "atividades" | "avaliacoes";

export interface MaterialEntry {
  titulo: string;
  subtitulo: string;
  conteudo: string;
  link: string;
  status: string;
}

export interface AtividadeEntry {
  enunciado: string;
  alternativa: string;
  status: string;
}

export type ContentEntry = MaterialEntry | AtividadeEntry;

export interface ContentTypeConfig {
  key: ContentKey;
  title: string;
  endpoint: string;
  buildPayload: (item: any, courseId: number, userId: number, index: number, refs: { user: any; course: any }) => object;
}

export function createEmptyEntry(key: ContentKey): ContentEntry {
  if (key === "atividades" || key === "avaliacoes") {
    return { enunciado: "", alternativa: "", status: "0" };
  }
  return { titulo: "", subtitulo: "", conteudo: "", link: "", status: "Nao concluido" };
}

export const CONTENT_TYPES: ContentTypeConfig[] = [
  {
    key: "material",
    title: "Materiais",
    endpoint: "material",
    buildPayload: (item, courseId, userId, _index, { course }) => ({
      titulo: item.titulo,
      subtitulo: item.subtitulo,
      conteudo: item.conteudo,
      link: item.link,
      statusMaterial: item.status?.trim() || "Nao concluido",
      usuario: { id: userId },
      curso: { id: courseId, nome: course.nome },
    }),
  },
  {
    key: "exercicios",
    title: "Exercicios",
    endpoint: "exercicio",
    buildPayload: (item, courseId, _userId, _index, { course }) => ({
      titulo: item.titulo,
      subtitulo: item.subtitulo,
      conteudo: item.conteudo,
      status: item.status,
      curso: { id: courseId, nome: course.nome },
    }),
  },
  {
    key: "atividades",
    title: "Atividades",
    endpoint: "atividade",
    buildPayload: (item, courseId, userId, _index, { user, course }) => ({
      enunciado: item.enunciado,
      alternativa: item.alternativa,
      status: Number(item.status) || 0,
      usuario: { id: userId, nome: user.nome },
      curso: { id: courseId, nome: course.nome },
    }),
  },
  {
    key: "avaliacoes",
    title: "Avaliacoes",
    endpoint: "avaliacao",
    buildPayload: (item, courseId, userId, _index, { user, course }) => ({
      enunciado: item.enunciado,
      alternativa: item.alternativa,
      status: Number(item.status) || 0,
      usuario: { id: userId, nome: user.nome },
      curso: { id: courseId, nome: course.nome },
    }),
  },
];
