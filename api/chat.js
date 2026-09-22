export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { message } = req.body || {};

  if (!message || typeof message !== "string" || message.length > 500) {
    return res.status(400).json({ error: "Mensagem inválida" });
  }

  const systemInstruction = `Você é o guia turístico virtual 'IA Explore Vitória'. Seu objetivo é fornecer roteiros de viagem práticos, organizados e personalizados em Vitória (Espírito Santo) e região metropolitana (Vila Velha, Serra, Guarapari).
Considere opções gastronômicas (moqueca, torta capixaba), passeios históricos, praias e transporte (Sistema Transcol e Aquaviário).
Seja amigável, direto, contextualizado e formate o roteiro de forma bem organizada com tópicos.`;

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("GEMINI_API_KEY não está definida no ambiente.");
    return res.status(500).json({ error: "Configuração ausente no servidor" });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${systemInstruction}\n\nSolicitação do usuário: ${message}`,
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Erro da API Gemini:", JSON.stringify(data));
      return res.status(response.status).json({
        error: "Erro na API do Gemini",
        detalhe: data.error?.message || "Sem detalhe",
      });
    }

    const texto =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Desculpe, ocorreu um erro ao gerar seu roteiro. Tente novamente!";

    return res.status(200).json({ resposta: texto });
  } catch (error) {
    console.error("Erro Gemini (catch):", error.message);
    return res.status(500).json({ error: "Erro ao gerar roteiro" });
  }
}
