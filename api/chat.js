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

  // Identificadores válidos da API REST do Gemini
  const MODELOS = [
    "gemini-1.5-flash-latest",
    "gemini-2.0-flash",
    "gemini-1.5-pro-latest",
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
        `Modelo ${modelo} falhou com status ${response.status}: ${ultimoErro}`,
      );

      // Se for 404 (modelo não existe nessa versão da API), 503 (sobrecarga) ou 429 (cota), tenta o próximo modelo
      if ([404, 503, 429].includes(response.status)) {
        await new Promise((r) => setTimeout(r, 200));
        continue;
      }

      // Para erros de autenticação ou chaves inválidas (400, 401, 403), interrompe
      return res.status(response.status).json({
        error: "Erro na API do Gemini",
        detalhe: ultimoErro,
      });
    } catch (error) {
      ultimoErro = error.message;
      console.error(`Erro de rede no modelo ${modelo}:`, error.message);
    }
  }

  return res.status(503).json({
    error: "Serviço da IA temporariamente indisponível.",
    detalhe: ultimoErro,
  });
}
