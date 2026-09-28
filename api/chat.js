export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { message } = req.body || {};

  if (!message || typeof message !== "string" || message.length > 500) {
    return res.status(400).json({ error: "Mensagem inválida" });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("GEMINI_API_KEY não está definida no ambiente.");
    return res.status(500).json({ error: "Configuração ausente no servidor" });
  }

  const systemInstruction = `Você é o guia turístico virtual 'IA Explore Vitória'. Seu objetivo é fornecer roteiros de viagem práticos, organizados e personalizados em Vitória (Espírito Santo) e região metropolitana (Vila Velha, Serra, Guarapari).
Considere opções gastronômicas (moqueca, torta capixaba), passeios históricos, praias e transporte (Sistema Transcol e Aquaviário).
Seja amigável, direto, contextualizado e formate o roteiro de forma bem organizada com tópicos.`;

  const body = JSON.stringify({
    contents: [
      {
        parts: [
          {
            text: `${systemInstruction}\n\nSolicitação do usuário: ${message}`,
          },
        ],
      },
    ],
  });

  // Lista de modelos leves por ordem de preferência para fallback
  const MODELOS = [
    "gemini-1.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash-8b",
  ];
  let ultimoErro = null;

  for (const modelo of MODELOS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });

      const data = await response.json();

      if (response.ok) {
        const texto =
          data.candidates?.[0]?.content?.parts?.[0]?.text ||
          "Desculpe, ocorreu um erro ao gerar seu roteiro. Tente novamente!";
        return res.status(200).json({ resposta: texto });
      }

      ultimoErro = data.error?.message || `Erro HTTP ${response.status}`;
      console.warn(
        `Modelo ${modelo} indisponível (${response.status}): ${ultimoErro}`,
      );

      // Se não for erro de sobrecarga/cota (ex: chave inválida), encerra imediatamente
      if (response.status !== 503 && response.status !== 429) {
        return res.status(response.status).json({
          error: "Erro na API do Gemini",
          detalhe: ultimoErro,
        });
      }

      // Pequena pausa (300ms) antes de tentar o próximo modelo reserva
      await new Promise((r) => setTimeout(r, 300));
    } catch (error) {
      ultimoErro = error.message;
      console.error(`Erro de rede no modelo ${modelo}:`, error.message);
    }
  }

  // Se todos os modelos da lista falharem
  return res.status(503).json({
    error: "Serviço da IA temporariamente indisponível por alta demanda.",
    detalhe: ultimoErro,
  });
}
